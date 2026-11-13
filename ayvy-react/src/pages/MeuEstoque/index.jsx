/**
 * Meu estoque (/meu-estoque, só lojista): planilha de estoque POR VARIAÇÃO (cor + tamanho) de cada
 * produto, por categoria; alertas de reposição; gráfico de vendas mês a mês e o card AYVY Premium.
 * Ligado às vendas: o checkout tira da variação comprada e o cancelamento/reembolso devolve (back).
 * Dados: services/estoqueApi.js (variações em /produtos/{id}/variacoes + relatório /estoque/relatorio).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import {
  adicionarPecas,
  atualizarQuantidade,
  desativarLinha,
  listarPlanilhaDaLoja,
  reativarLinha,
  relatorioEstoque,
} from "../../services/estoqueApi";
import { COR_UNICA, TAMANHO_UNICO } from "../../services/lojistaApi";
import { formatBRL } from "../../utils/cartHelpers";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./style.css";

const IMAGEM_PADRAO = "/assets/img/ayvy-media-a.png";
const ESTOQUE_BAIXO = 2;
const AVISOS_VISIVEIS = 4;
const OUTRO = "__outro__";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function nomeCategoria(produto) {
  const c = produto?.categoria;
  if (!c) return "Sem categoria";
  return c.categoriaPai ? `${c.categoriaPai.nome} › ${c.nome}` : c.nome;
}

function rotuloLinha(linha) {
  const detalhes = [linha.cor, linha.tamanho].filter((v) => v && v !== COR_UNICA && v !== TAMANHO_UNICO);
  return `${linha.produto?.nome || "Produto"}${detalhes.length ? ` (${detalhes.join(", ")})` : ""}`;
}

/** Lista contínua de meses (aaaa-mm) do primeiro registro até o mês atual. */
function mesesDesde(inicio) {
  const hoje = new Date();
  const fim = hoje.getFullYear() * 12 + hoje.getMonth();
  let atual = inicio ? inicio.getFullYear() * 12 + inicio.getMonth() : fim;
  if (fim - atual > 23) atual = fim - 23;
  const lista = [];
  for (; atual <= fim; atual += 1) {
    const ano = Math.floor(atual / 12);
    const mes = atual % 12;
    lista.push({ chave: `${ano}-${String(mes + 1).padStart(2, "0")}`, ano, mes });
  }
  return lista;
}

export default function MeuEstoque() {
  const { user } = useAuth();
  const lojistaId = user?.lojistaId;
  const [linhas, setLinhas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [quantidades, setQuantidades] = useState({});
  const [remover, setRemover] = useState(null);
  const FORM_VAZIO = { produtoId: "", cor: "", corOutra: "", tamanho: "", tamanhoOutro: "", quantidade: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const [premiumAviso, setPremiumAviso] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [verTodosAvisos, setVerTodosAvisos] = useState(false);

  const recarregar = useCallback(async () => {
    if (!lojistaId) return;
    try {
      const [planilha, rel] = await Promise.all([
        listarPlanilhaDaLoja(lojistaId),
        relatorioEstoque(lojistaId).catch(() => null),
      ]);
      setLinhas(planilha.linhas);
      setProdutos(planilha.produtos);
      setRelatorio(rel);
      setQuantidades({});
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar o estoque.");
    } finally {
      setCarregando(false);
    }
  }, [lojistaId]);

  useEffect(() => {
    const t = setTimeout(recarregar, 0);
    return () => clearTimeout(t);
  }, [recarregar]);

  const vendidosPorLinha = useMemo(() => {
    const mapa = {};
    const porItem = relatorio?.porItem || [];
    const igual = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();
    for (const l of linhas) {
      mapa[l.id] = porItem
        .filter((i) =>
          i.produtoVariacaoId != null
            ? i.produtoVariacaoId === l.id
            : i.produtoId === l.produto?.id && igual(i.tamanho, l.tamanho) && igual(i.cor, l.cor),
        )
        .reduce((soma, i) => soma + i.vendidos, 0);
    }
    return mapa;
  }, [linhas, relatorio]);

  const linhasAtivas = linhas.filter((l) => l.ativo);
  const linhasDesativadas = linhas.filter((l) => !l.ativo);

  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const l of linhasAtivas) {
      const nome = nomeCategoria(l.produto);
      if (!mapa.has(nome)) mapa.set(nome, []);
      mapa.get(nome).push(l);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [linhasAtivas]);

  const zerados = linhasAtivas.filter((l) => l.quantidade === 0);
  const baixos = linhasAtivas.filter((l) => l.quantidade > 0 && l.quantidade <= ESTOQUE_BAIXO);
  // Avisos agrupados por produto + cor (cada tamanho vira uma etiqueta), zerados primeiro.
  const avisos = useMemo(() => {
    const mapa = new Map();
    for (const l of [...zerados, ...baixos]) {
      const chave = `${l.produto?.id}|${String(l.cor).toLowerCase()}`;
      if (!mapa.has(chave)) mapa.set(chave, { chave, produto: l.produto, cor: l.cor, itens: [] });
      mapa.get(chave).itens.push(l);
    }
    const grupos = [...mapa.values()];
    for (const g of grupos) g.itens.sort((a, b) => a.quantidade - b.quantidade || a.id - b.id);
    return grupos.sort((a, b) => b.itens.filter((l) => l.quantidade === 0).length - a.itens.filter((l) => l.quantidade === 0).length);
  }, [zerados, baixos]);
  const avisosNaTela = verTodosAvisos ? avisos : avisos.slice(0, AVISOS_VISIVEIS);

  const totalPecas = linhasAtivas.reduce((s, l) => s + l.quantidade, 0);
  const valorEstoque = linhasAtivas.reduce(
    (s, l) => s + l.quantidade * (Number(l.produto?.precoFinal ?? l.produto?.preco) || 0),
    0,
  );
  const produtosNaPlanilha = new Set(linhasAtivas.map((l) => l.produto?.id)).size;

  const produtoEscolhido = produtos.find((p) => String(p.id) === String(form.produtoId));
  const produtosPorCategoria = useMemo(() => {
    const mapa = new Map();
    for (const p of produtos) {
      const nome = nomeCategoria(p);
      if (!mapa.has(nome)) mapa.set(nome, []);
      mapa.get(nome).push(p);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [produtos]);

  const grafico = useMemo(() => {
    const meses = relatorio?.meses || [];
    const datas = linhas.map((l) => (l.criadoEm ? new Date(l.criadoEm) : null)).filter(Boolean);
    if (meses[0]) {
      const [a, m] = meses[0].mes.split("-").map(Number);
      datas.push(new Date(a, m - 1, 1));
    }
    datas.push(new Date(new Date().getFullYear(), 0, 1));
    const inicio = new Date(Math.min(...datas.map((d) => d.getTime())));
    const porChave = Object.fromEntries(meses.map((m) => [m.mes, m]));
    const barras = mesesDesde(inicio).reduce((lista, m) => {
      const { vendidos = 0, valorVendido = 0, devolvidos = 0, valorDevolvido = 0 } = porChave[m.chave] || {};
      const dados = { vendidos, valorVendido, devolvidos, valorDevolvido };
      const anterior = lista[lista.length - 1];
      return [
        ...lista,
        {
          ...dados,
          ...m,
          acumulado: (anterior?.acumulado || 0) + dados.vendidos,
          valorAcumulado: (anterior?.valorAcumulado || 0) + dados.valorVendido,
        },
      ];
    }, []);
    const maximo = Math.max(1, ...barras.map((b) => b.acumulado));
    return { barras, maximo };
  }, [relatorio, linhas]);

  async function atualizar() {
    setAtualizando(true);
    setAviso("");
    await recarregar();
    setAtualizando(false);
    setAviso(
      `Planilha atualizada às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
    );
  }

  async function executar(acao, mensagem) {
    setSalvando(true);
    setErro("");
    try {
      await acao();
      await recarregar();
      if (mensagem) setAviso(mensagem);
    } catch (e) {
      setErro(e.message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function adicionar(e) {
    e.preventDefault();
    const quantidade = Number(form.quantidade);
    const cor = (form.cor === OUTRO ? form.corOutra.trim() : form.cor) || COR_UNICA;
    const tamanho = (form.tamanho === OUTRO ? form.tamanhoOutro.trim() : form.tamanho) || TAMANHO_UNICO;
    if (!form.produtoId) return setErro("Escolha o produto.");
    if (!Number.isInteger(quantidade) || quantidade < 0) return setErro("Informe a quantidade de peças.");
    executar(
      () => adicionarPecas({ produtoId: Number(form.produtoId), cor, tamanho, quantidade }),
      `${quantidade} peça(s) de ${rotuloLinha({ produto: produtoEscolhido, cor, tamanho })} no estoque.`,
    ).then(() => {
      setForm(FORM_VAZIO);
      setFormAberto(false);
    });
  }

  function salvarQuantidade(linha, valor) {
    const n = Math.max(0, Math.round(Number(valor)));
    if (!Number.isFinite(n) || n === linha.quantidade) {
      setQuantidades((q) => ({ ...q, [linha.id]: undefined }));
      return;
    }
    executar(() => atualizarQuantidade(linha, n));
  }

  function confirmarRemocao() {
    const linha = remover;
    setRemover(null);
    executar(() => desativarLinha(linha), `${rotuloLinha(linha)} foi desativada e saiu da loja.`);
  }

  function focarQuantidade(linha) {
    const campo = document.getElementById(`est-qtd-${linha.id}`);
    if (!campo) return;
    campo.scrollIntoView({ block: "center", behavior: "smooth" });
    campo.focus({ preventScroll: true });
    campo.select();
  }

  function reativar(linha) {
    executar(() => reativarLinha(linha), `${rotuloLinha(linha)} voltou para a loja.`);
  }

  if (!lojistaId) {
    return (
      <div className="est-page">
        <p className="est-status">Entre com uma conta de lojista para usar o Meu estoque.</p>
      </div>
    );
  }

  return (
    <div className="est-page">
      <header className="est-head">
        <div>
          <p className="est-eyebrow">Exclusivo para lojistas</p>
          <h1>
            <i className="fas fa-boxes-stacked" aria-hidden /> Meu estoque
          </h1>
          <p className="est-sub">
            Sua planilha de peças por categoria. Cada venda sai daqui automaticamente, e cancelamentos ou
            reembolsos voltam para o estoque.
          </p>
        </div>
        <div className="est-head__acoes">
          {produtos.length > 0 ? (
            <button
              type="button"
              className={`est-btn ${formAberto ? "est-btn--ghost" : "est-btn--primary"}`}
              onClick={() => setFormAberto((v) => !v)}
              aria-expanded={formAberto}
            >
              <i className={`fas ${formAberto ? "fa-times" : "fa-plus"}`} aria-hidden />{" "}
              {formAberto ? "Fechar" : "Adicionar peças"}
            </button>
          ) : null}
          <button
            type="button"
            className="est-btn est-btn--ghost"
            onClick={atualizar}
            disabled={salvando || atualizando}
          >
            <i className={`fas fa-sync-alt${atualizando ? " fa-spin" : ""}`} aria-hidden />{" "}
            {atualizando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </header>

      {erro ? <p className="est-msg est-msg--erro">{erro}</p> : null}
      {aviso ? (
        <p className="est-msg est-msg--ok" role="status">
          <i className="fas fa-check-circle" aria-hidden /> {aviso}
          <button type="button" onClick={() => setAviso("")} aria-label="Fechar aviso">
            <i className="fas fa-times" />
          </button>
        </p>
      ) : null}

      {carregando ? (
        <p className="est-status">
          <span className="est-spinner" aria-hidden /> Carregando seu estoque…
        </p>
      ) : produtos.length === 0 ? (
        <section className="est-card est-vazio">
          <span className="est-vazio__icone" aria-hidden>
            <i className="fas fa-table" />
          </span>
          <h2>Sua planilha de estoque começa pelos produtos</h2>
          <p>
            Cada produto tem variações (cor + tamanho) e cada variação tem o seu estoque — ex.: Tênis preto 38
            e Tênis preto 39. Cadastre um produto para começar.
          </p>
          <Link to={`/loja/${user.shopSlug}/produto/novo`} className="est-btn est-btn--primary">
            <i className="fas fa-plus" aria-hidden /> Cadastrar meu primeiro produto
          </Link>
        </section>
      ) : (
        <>
          <section className="est-resumo">
            <article>
              <span>Produtos na planilha</span>
              <strong>{produtosNaPlanilha}</strong>
            </article>
            <article>
              <span>Peças em estoque</span>
              <strong>{totalPecas}</strong>
            </article>
            <article>
              <span>Valor em estoque</span>
              <strong>{formatBRL(valorEstoque)}</strong>
            </article>
            <article className={zerados.length ? "is-alerta" : ""}>
              <span>Precisam de reposição</span>
              <strong>{zerados.length}</strong>
            </article>
          </section>

          {avisos.length > 0 ? (
            <section className="est-avisos" aria-label="Atenção ao estoque">
              <header className="est-avisos__topo">
                <span className="est-avisos__icone" aria-hidden>
                  <i className="fas fa-bell" />
                </span>
                <div className="est-avisos__titulo">
                  <h2>Atenção ao estoque</h2>
                  <p>Toque num tamanho para repor a quantidade na planilha.</p>
                </div>
                <div className="est-avisos__contagem">
                  {zerados.length ? (
                    <span className="est-pill est-pill--zerado">{zerados.length} sem estoque</span>
                  ) : null}
                  {baixos.length ? <span className="est-pill est-pill--baixo">{baixos.length} acabando</span> : null}
                </div>
              </header>
              <ul className="est-avisos__lista">
                {avisosNaTela.map((g) => {
                  const qtdIgual =
                    g.itens.length > 1 && g.itens.every((l) => l.quantidade === g.itens[0].quantidade)
                      ? g.itens[0].quantidade
                      : null;
                  const detalhes = [
                    g.cor && g.cor !== COR_UNICA ? g.cor : null,
                    qtdIgual === 0 ? "sem estoque em nenhum tamanho" : qtdIgual ? `restam ${qtdIgual} de cada` : null,
                  ].filter(Boolean);
                  return (
                  <li key={g.chave} className="est-aviso">
                    <img
                      src={resolveImageUrl(g.produto?.imagemPrincipalUrl) || IMAGEM_PADRAO}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = IMAGEM_PADRAO;
                      }}
                    />
                    <div className="est-aviso__info">
                      <strong>{g.produto?.nome || "Produto"}</strong>
                      {detalhes.length ? <small>{detalhes.join(" · ")}</small> : null}
                    </div>
                    <div className="est-aviso__tamanhos">
                      {g.itens.map((l) => {
                        const zerado = l.quantidade === 0;
                        const tamanho = l.tamanho === TAMANHO_UNICO ? "Único" : l.tamanho;
                        return (
                          <span key={l.id} className={`est-tam est-tam--${zerado ? "zerado" : "baixo"}`}>
                            <button
                              type="button"
                              onClick={() => focarQuantidade(l)}
                              title={zerado ? `Repor ${rotuloLinha(l)}` : `Restam ${l.quantidade} de ${rotuloLinha(l)}`}
                            >
                              {tamanho}
                              {qtdIgual === null ? <b>{l.quantidade}</b> : null}
                            </button>
                            {zerado ? (
                              <button
                                type="button"
                                className="est-tam__x"
                                onClick={() => setRemover(l)}
                                aria-label={`Desativar ${rotuloLinha(l)}`}
                                title="Desativar variação"
                              >
                                ×
                              </button>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  </li>
                  );
                })}
              </ul>
              {avisos.length > AVISOS_VISIVEIS ? (
                <button type="button" className="est-avisos__mais" onClick={() => setVerTodosAvisos((v) => !v)}>
                  {verTodosAvisos ? "Mostrar menos" : `Ver todos (${avisos.length} produtos)`}
                  <i className={`fas fa-chevron-${verTodosAvisos ? "up" : "down"}`} aria-hidden />
                </button>
              ) : null}
            </section>
          ) : null}

          {formAberto ? (
          <section className="est-card est-card--form">
            <h2>
              <i className="fas fa-plus-circle" aria-hidden /> Adicionar produtos da loja ao estoque
            </h2>
            <form className="est-form" onSubmit={adicionar}>
              <label>
                <span>Produtos da loja</span>
                <select
                  value={form.produtoId}
                  onChange={(e) => setForm({ ...FORM_VAZIO, produtoId: e.target.value, quantidade: form.quantidade })}
                >
                  <option value="">Escolha…</option>
                  {produtosPorCategoria.map(([categoria, lista]) => (
                    <optgroup key={categoria} label={categoria}>
                      {lista.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                          {String(p.status).toLowerCase() !== "ativo" ? " (rascunho)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                <span>Cor</span>
                <select value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })}>
                  <option value="">{(produtoEscolhido?.cores || []).length ? "Escolha…" : COR_UNICA}</option>
                  {(produtoEscolhido?.cores || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={OUTRO}>Outra cor…</option>
                </select>
              </label>
              {form.cor === OUTRO ? (
                <label>
                  <span>Qual cor?</span>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="Ex.: Preto"
                    value={form.corOutra}
                    onChange={(e) => setForm({ ...form, corOutra: e.target.value })}
                  />
                </label>
              ) : null}
              <label>
                <span>Tamanho / numeração</span>
                <select value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })}>
                  <option value="">{(produtoEscolhido?.tamanhos || []).length ? "Escolha…" : TAMANHO_UNICO}</option>
                  {(produtoEscolhido?.tamanhos || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value={OUTRO}>Outro…</option>
                </select>
              </label>
              {form.tamanho === OUTRO ? (
                <label>
                  <span>Qual tamanho?</span>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="Ex.: 37, GG, 2 anos"
                    value={form.tamanhoOutro}
                    onChange={(e) => setForm({ ...form, tamanhoOutro: e.target.value })}
                  />
                </label>
              ) : null}
              <label className="est-form__qtd">
                <span>Quantidade</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex.: 10"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </label>
              <button type="submit" className="est-btn est-btn--primary" disabled={salvando}>
                Adicionar
              </button>
            </form>
            <p className="est-dica">
              Já existe essa cor e tamanho no produto? A quantidade é somada (e a variação volta a ficar ativa).
              Produto novo? Cadastre em <Link to={`/loja/${user.shopSlug}/produto/novo`}>Novo produto</Link>.
            </p>
          </section>
          ) : null}

          <section className="est-card">
            <h2>
              <i className="fas fa-table" aria-hidden /> Planilha de estoque
            </h2>
            {grupos.map(([categoria, lista]) => (
              <div key={categoria} className="est-grupo">
                <h3>
                  {categoria}
                  <small>{lista.reduce((s, l) => s + l.quantidade, 0)} peça(s)</small>
                </h3>
                <div className="est-tabela-wrap">
                  <table className="est-tabela">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Cor</th>
                        <th>Tamanho</th>
                        <th>Em estoque</th>
                        <th>Vendidos</th>
                        <th>Situação</th>
                        <th aria-label="Ações" />
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((l) => {
                        const valorCampo = quantidades[l.id] ?? String(l.quantidade);
                        const situacao =
                          l.quantidade === 0 ? "zerado" : l.quantidade <= ESTOQUE_BAIXO ? "baixo" : "ok";
                        return (
                          <tr key={l.id} className={`is-${situacao}`}>
                            <td>
                              <span className="est-produto">
                                <img
                                  src={resolveImageUrl(l.produto?.imagemPrincipalUrl) || IMAGEM_PADRAO}
                                  alt=""
                                  onError={(e) => {
                                    e.currentTarget.src = IMAGEM_PADRAO;
                                  }}
                                />
                                <span>
                                  {l.produto?.nome}
                                  <small>{formatBRL(Number(l.produto?.precoFinal ?? l.produto?.preco) || 0)}</small>
                                </span>
                              </span>
                            </td>
                            <td>{l.cor}</td>
                            <td>{l.tamanho}</td>
                            <td>
                              <span className="est-qtd">
                                <button
                                  type="button"
                                  aria-label="Tirar uma"
                                  disabled={salvando || l.quantidade === 0}
                                  onClick={() => salvarQuantidade(l, l.quantidade - 1)}
                                >
                                  −
                                </button>
                                <input
                                  id={`est-qtd-${l.id}`}
                                  type="number"
                                  min={0}
                                  value={valorCampo}
                                  onChange={(e) => setQuantidades((q) => ({ ...q, [l.id]: e.target.value }))}
                                  onBlur={(e) => salvarQuantidade(l, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") e.currentTarget.blur();
                                  }}
                                />
                                <button
                                  type="button"
                                  aria-label="Somar uma"
                                  disabled={salvando}
                                  onClick={() => salvarQuantidade(l, l.quantidade + 1)}
                                >
                                  +
                                </button>
                              </span>
                            </td>
                            <td>{vendidosPorLinha[l.id] || 0}</td>
                            <td>
                              <span className={`est-chip est-chip--${situacao}`}>
                                {situacao === "zerado" ? "Repor" : situacao === "baixo" ? "Baixo" : "OK"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="est-remover"
                                onClick={() => setRemover(l)}
                                aria-label={`Desativar ${rotuloLinha(l)}`}
                                title="Desativar variação (some da loja)"
                              >
                                <i className="fas fa-eye-slash" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {grupos.length === 0 ? (
              <p className="est-dica">
                Nenhuma variação ativa ainda. Use "Adicionar peças" para criar a primeira (produto + cor + tamanho).
              </p>
            ) : null}
          </section>

          {linhasDesativadas.length > 0 ? (
            <section className="est-card est-desativadas">
              <h2>
                <i className="fas fa-eye-slash" aria-hidden /> Variações desativadas
              </h2>
              <p className="est-dica">Não aparecem na loja. O histórico de vendas continua salvo.</p>
              <ul>
                {linhasDesativadas.map((l) => (
                  <li key={l.id}>
                    <span>
                      {rotuloLinha(l)} · {l.quantidade} peça(s)
                    </span>
                    <button type="button" className="est-btn est-btn--ghost" disabled={salvando} onClick={() => reativar(l)}>
                      <i className="fas fa-eye" aria-hidden /> Reativar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {!carregando ? (
        <section className="est-card">
          <h2>
            <i className="fas fa-chart-line" aria-hidden /> Vendas do estoque
          </h2>
          <div className="est-totais">
            <article>
              <span>Peças vendidas</span>
              <strong>{relatorio?.totalVendidos || 0}</strong>
            </article>
            <article>
              <span>Total vendido</span>
              <strong>{formatBRL(relatorio?.valorVendido || 0)}</strong>
            </article>
            <article className="is-devolucao">
              <span>Reembolsos e cancelamentos</span>
              <strong>
                {relatorio?.totalDevolvidos || 0} · {formatBRL(relatorio?.valorDevolvido || 0)}
              </strong>
            </article>
          </div>

          <div className="est-grafico-head">
            <span>
              <i className="fas fa-circle est-legenda--vendas" aria-hidden /> Peças vendidas (acumulado)
            </span>
            <span>
              Até agora: <b>{grafico.barras.at(-1)?.acumulado || 0} peça(s)</b> ·{" "}
              <b>{formatBRL(grafico.barras.at(-1)?.valorAcumulado || 0)}</b>
            </span>
          </div>
          <div className="est-grafico" role="img" aria-label="Peças vendidas acumuladas por mês">
            <span className="est-grafico__grade" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            {grafico.barras.map((b) => (
              <div
                key={b.chave}
                className={`est-grafico__col${b.vendidos > 0 ? " tem-venda" : ""}`}
                title={`${MESES_LONGOS[b.mes]} de ${b.ano}: ${b.vendidos} vendida(s) no mês (${formatBRL(
                  b.valorVendido,
                )}), ${b.acumulado} no total${b.devolvidos ? `, ${b.devolvidos} devolvida(s)` : ""}`}
              >
                <span className="est-grafico__valor">{b.acumulado}</span>
                {b.vendidos > 0 || b.devolvidos > 0 ? (
                  <span className="est-grafico__selos">
                    {b.vendidos > 0 ? (
                      <span className="est-grafico__mais" title="Vendas no mês">
                        +{b.vendidos}
                      </span>
                    ) : null}
                    {b.devolvidos > 0 ? (
                      <span className="est-grafico__devolucao" title="Devoluções no mês (voltaram para o estoque)">
                        <i className="fas fa-undo" aria-hidden />
                        {b.devolvidos}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                <span
                  className="est-grafico__barra"
                  style={{ height: `${b.acumulado ? Math.max(6, (b.acumulado / grafico.maximo) * 100) : 2}%` }}
                />
                <span className="est-grafico__mes">
                  {MESES[b.mes]}
                  <small>{b.ano}</small>
                </span>
              </div>
            ))}
          </div>
          <p className="est-dica">
            O gráfico começa do zero no início do ano (ou quando a sua loja começou) e soma, mês a mês, as peças
            que saíram do seu estoque. O “+” mostra as vendas de cada mês e o <i className="fas fa-undo" /> as
            devoluções.
          </p>

          <ul className="est-meses">
            {[...grafico.barras]
              .reverse()
              .filter((b) => b.vendidos > 0 || b.devolvidos > 0)
              .map((b) => (
                <li key={b.chave}>
                  <strong>
                    {MESES_LONGOS[b.mes]} de {b.ano}
                  </strong>
                  {b.vendidos > 0 ? (
                    <span>
                      {b.vendidos} {b.vendidos === 1 ? "peça saiu" : "peças saíram"} do seu estoque no valor de{" "}
                      <b>{formatBRL(b.valorVendido)}</b>.
                    </span>
                  ) : null}
                  {b.devolvidos > 0 ? (
                    <span className="est-meses__devolucao">
                      Você teve {b.devolvidos} {b.devolvidos === 1 ? "devolução" : "devoluções"} (reembolso ou
                      cancelamento) no valor de <b>{formatBRL(b.valorDevolvido)}</b>, que voltaram para o estoque.
                    </span>
                  ) : null}
                </li>
              ))}
            {grafico.barras.every((b) => b.vendidos === 0 && b.devolvidos === 0) ? (
              <li className="est-meses__vazio">Ainda não houve vendas. Assim que um cliente comprar, aparece aqui.</li>
            ) : null}
          </ul>

          {relatorio?.movimentos?.length ? (
            <>
              <h3 className="est-subtitulo">Últimas movimentações</h3>
              <ul className="est-movimentos">
                {relatorio.movimentos.slice(0, 12).map((m, i) => (
                  <li key={`${m.codigo}-${m.produto}-${m.tamanho}-${i}`} className={`is-${m.tipo}`}>
                    <i
                      className={`fas ${m.tipo === "venda" ? "fa-arrow-down" : "fa-undo"}`}
                      aria-hidden
                    />
                    <span>
                      {m.tipo === "venda"
                        ? `Venda: ${m.quantidade}× ${rotuloLinha({ produto: { nome: m.produto }, cor: m.cor, tamanho: m.tamanho })} saiu do estoque`
                        : `${m.tipo === "reembolso" ? "Reembolso" : "Cancelamento"}: ${m.quantidade}× ${rotuloLinha({
                            produto: { nome: m.produto },
                            cor: m.cor,
                            tamanho: m.tamanho,
                          })} voltou para o estoque`}
                      {m.codigo ? <small> · #{m.codigo}</small> : null}
                    </span>
                    <b>
                      {m.tipo === "venda" ? "" : "−"}
                      {formatBRL(m.valor)}
                    </b>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="est-premium">
        <div>
          <p className="est-premium__tag">
            <i className="fas fa-crown" aria-hidden /> AYVY Premium
          </p>
          <h2>Obtenha recursos AYVY Premium</h2>
          <ul>
            <li>Relatórios avançados de vendas e reposição</li>
            <li>Alertas de estoque por e-mail e WhatsApp</li>
            <li>Exportar a planilha para Excel</li>
            <li>Ver o ranking da sua loja na AYVY (ex.: sua loja está no Top 3 em vendas)</li>
            <li>Mais destaque para a sua loja na vitrine</li>
          </ul>
        </div>
        <div className="est-premium__cta">
          <button type="button" className="est-btn est-btn--premium" onClick={() => setPremiumAviso(true)}>
            Assinar plano
          </button>
          {premiumAviso ? <small>Os planos AYVY Premium chegam em breve!</small> : null}
        </div>
      </section>

      <ConfirmDialog
        open={!!remover}
        title="Desativar esta variação?"
        message={
          remover
            ? `${rotuloLinha(remover)} deixa de aparecer na loja e não pode mais ser comprada. O histórico de vendas fica salvo e você pode reativar depois.`
            : ""
        }
        confirmLabel="Sim, desativar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setRemover(null)}
        onConfirm={confirmarRemocao}
      />
    </div>
  );
}
