import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listCategoriasApi } from "../../services/categoriasApi";
import { listProdutosApi } from "../../services/shopApi";
import { idPrincipal, montarArvoreCategorias } from "../../utils/categoriaArvore";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./style.css";

const IMAGEM_PADRAO = "/assets/img/ayvy-media-a.png";
const ICONE_PADRAO = "fa-tag";
const PARA_VOCE = "para-voce";
const NOVIDADES = "novidades";
const ITENS_POR_SECAO = 9;

function slugDaLoja(lojista) {
  return String(lojista?.slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function mapProduto(p) {
  const lojaSlug = slugDaLoja(p.lojista);
  return {
    id: p.id,
    nome: p.nome || "Produto",
    imagem: resolveImageUrl(p.imagemPrincipalUrl) || IMAGEM_PADRAO,
    to: lojaSlug ? `/loja/${lojaSlug}/p/${p.id}` : null,
    categoriaId: p.categoria?.id ?? null,
    principalId: idPrincipal(p.categoria),
    categoriaNome: p.categoria?.nome || "",
    principalNome: p.categoria?.categoriaPai?.nome || p.categoria?.nome || "",
    visualizacoes: Number(p.visualizacoesTotal) || 0,
    criadoEm: p.criadoEm ? new Date(p.criadoEm).getTime() : 0,
    loja: lojaSlug
      ? {
          slug: lojaSlug,
          nome: p.lojista?.nomeLoja || lojaSlug,
          imagem: resolveImageUrl(p.lojista?.logoUrl) || `https://i.pravatar.cc/150?u=${lojaSlug}`,
        }
      : null,
  };
}

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function linkCategoria(slug, extra = {}) {
  const params = new URLSearchParams({ c: slug, ...extra });
  return `/categorias?${params}`;
}

function CatItem({ to, imagem, nome, icone, detalhe }) {
  const conteudo = (
    <>
      <span className={`cat-item__img${icone ? " cat-item__img--icone" : ""}`}>
        {icone ? <i className={`fas ${icone}`} aria-hidden /> : <img src={imagem} alt="" loading="lazy" />}
      </span>
      <span className="cat-item__name">{nome}</span>
      {detalhe ? <span className="cat-item__detalhe">{detalhe}</span> : null}
    </>
  );
  return to ? (
    <Link to={to} className="cat-item">
      {conteudo}
    </Link>
  ) : (
    <span className="cat-item">{conteudo}</span>
  );
}

function Secao({ titulo, children }) {
  return (
    <section className="cat-section">
      <h2>{titulo}</h2>
      <div className="cat-grid">{children}</div>
    </section>
  );
}

function ItensProdutos({ lista }) {
  return lista.map((p) => <CatItem key={p.id} to={p.to} imagem={p.imagem} nome={p.nome} />);
}

function lojasDe(lista) {
  return [...new Map(lista.filter((p) => p.loja).map((p) => [p.loja.slug, p.loja])).values()];
}

/** Lojas que vendem na lista, com as subcategorias em que cada uma tem produto. */
function lojasComSubcategorias(lista) {
  const mapa = new Map();
  for (const p of lista) {
    if (!p.loja) continue;
    if (!mapa.has(p.loja.slug)) mapa.set(p.loja.slug, { ...p.loja, subs: new Set() });
    if (p.categoriaNome) mapa.get(p.loja.slug).subs.add(p.categoriaNome);
  }
  return [...mapa.values()].map((l) => ({ ...l, subs: [...l.subs] }));
}

export default function Categorias() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selecionada = searchParams.get("c") || PARA_VOCE;
  const verTodos = searchParams.get("todos") === "1";
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([listCategoriasApi(), listProdutosApi()]);
        if (cancelado) return;
        setCategorias(cats || []);
        setProdutos(
          (prods || [])
            .filter((p) => String(p.status || "").toLowerCase() === "ativo")
            .map(mapProduto)
            .filter((p) => p.to),
        );
      } catch (e) {
        if (!cancelado) setErro(e.message || "Não foi possível carregar as categorias.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const arvore = useMemo(() => montarArvoreCategorias(categorias), [categorias]);

  const porCategoria = useMemo(() => {
    const mapa = new Map();
    for (const p of produtos) {
      for (const id of new Set([p.categoriaId, p.principalId])) {
        if (id == null) continue;
        if (!mapa.has(id)) mapa.set(id, []);
        mapa.get(id).push(p);
      }
    }
    return mapa;
  }, [produtos]);

  const produtosDe = (id) => porCategoria.get(id) || [];

  const principalAtual = arvore.find((p) => p.slug === selecionada) || null;
  const subAtual = principalAtual
    ? null
    : arvore.flatMap((p) => p.filhas.map((f) => ({ ...f, principal: p }))).find((f) => f.slug === selecionada) ||
      null;
  const principalDoMenu = principalAtual || subAtual?.principal || null;
  const termo = normalizar(busca.trim());

  function selecionar(chave) {
    setBusca("");
    setSearchParams(chave === PARA_VOCE ? {} : { c: chave });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function imagemDaSub(sub, principal) {
    const primeiro = produtosDe(sub.id)[0];
    return primeiro ? { imagem: primeiro.imagem } : { icone: principal.icone || ICONE_PADRAO };
  }

  function renderBusca() {
    const subsAchadas = arvore.flatMap((p) =>
      [p, ...p.filhas].filter((c) => normalizar(c.nome).includes(termo)).map((c) => ({ c, principal: p })),
    );
    const achados = produtos.filter(
      (p) =>
        normalizar(p.nome).includes(termo) ||
        normalizar(p.categoriaNome).includes(termo) ||
        normalizar(p.principalNome).includes(termo),
    );
    if (subsAchadas.length === 0 && achados.length === 0) {
      return <p className="cat-status">Nada encontrado para "{busca.trim()}".</p>;
    }
    return (
      <>
        {subsAchadas.length > 0 ? (
          <Secao titulo="Categorias">
            {subsAchadas.map(({ c, principal }) => (
              <CatItem
                key={c.id}
                to={linkCategoria(c.slug)}
                nome={c.nome}
                {...(c.id === principal.id
                  ? { icone: principal.icone || ICONE_PADRAO }
                  : imagemDaSub(c, principal))}
              />
            ))}
          </Secao>
        ) : null}
        {achados.length > 0 ? (
          <Secao titulo={`Produtos para "${busca.trim()}"`}>
            <ItensProdutos lista={achados} />
          </Secao>
        ) : null}
      </>
    );
  }

  function renderPrincipal(principal) {
    const todos = produtosDe(principal.id);
    if (verTodos) {
      return (
        <>
          <nav className="cat-trilha">
            <Link to={linkCategoria(principal.slug)}>{principal.nome}</Link> <span>›</span> Ver tudo
          </nav>
          {todos.length ? (
            <Secao titulo={`Tudo em ${principal.nome}`}>
              <ItensProdutos lista={todos} />
            </Secao>
          ) : (
            <p className="cat-status">Ainda não há produtos em {principal.nome}.</p>
          )}
        </>
      );
    }
    const lojas = lojasComSubcategorias(todos);
    return (
      <>
        <Secao titulo="Compre por categoria">
          <CatItem
            to={linkCategoria(principal.slug, { todos: "1" })}
            icone="fa-th-large"
            nome="Ver tudo"
          />
          {principal.filhas.map((sub) => (
            <CatItem
              key={sub.id}
              to={linkCategoria(sub.slug)}
              nome={sub.nome}
              {...imagemDaSub(sub, principal)}
            />
          ))}
        </Secao>
        {todos.length === 0 ? (
          <p className="cat-status cat-status--dica">
            Ainda não há produtos em {principal.nome}. Assim que um lojista cadastrar, eles aparecem aqui.
          </p>
        ) : null}
        {lojas.length > 0 ? (
          <Secao titulo={`Lojas com ${principal.nome}`}>
            {lojas.map((l) => (
              <CatItem
                key={l.slug}
                to={`/loja/${l.slug}`}
                imagem={l.imagem}
                nome={l.nome}
                detalhe={l.subs.join(", ")}
              />
            ))}
          </Secao>
        ) : null}
      </>
    );
  }

  function renderSub(sub) {
    const lista = produtosDe(sub.id);
    const lojas = lojasDe(lista);
    return (
      <>
        <nav className="cat-trilha">
          <Link to={linkCategoria(sub.principal.slug)}>{sub.principal.nome}</Link> <span>›</span> {sub.nome}
        </nav>
        {lista.length ? (
          <Secao titulo={sub.nome}>
            <ItensProdutos lista={lista} />
          </Secao>
        ) : (
          <p className="cat-status cat-status--dica">
            Ainda não há produtos em {sub.nome}. Assim que um lojista cadastrar, eles aparecem aqui.
          </p>
        )}
        {lojas.length > 0 ? (
          <Secao titulo={`Lojas com ${sub.nome}`}>
            {lojas.map((l) => (
              <CatItem key={l.slug} to={`/loja/${l.slug}`} imagem={l.imagem} nome={l.nome} />
            ))}
          </Secao>
        ) : null}
        <Secao titulo={`Mais em ${sub.principal.nome}`}>
          {sub.principal.filhas
            .filter((f) => f.id !== sub.id)
            .map((f) => (
              <CatItem key={f.id} to={linkCategoria(f.slug)} nome={f.nome} {...imagemDaSub(f, sub.principal)} />
            ))}
        </Secao>
      </>
    );
  }

  function renderParaVoce() {
    const escolhas = [...produtos]
      .sort((a, b) => b.visualizacoes - a.visualizacoes)
      .slice(0, ITENS_POR_SECAO);
    return (
      <>
        <Secao titulo="Escolhas para você">
          <ItensProdutos lista={escolhas} />
        </Secao>
        {arvore
          .filter((p) => produtosDe(p.id).length > 0)
          .map((p) => (
            <Secao key={p.id} titulo={p.nome}>
              <CatItem to={linkCategoria(p.slug)} icone={p.icone || "fa-th-large"} nome="Ver tudo" />
              <ItensProdutos lista={produtosDe(p.id).slice(0, ITENS_POR_SECAO - 1)} />
            </Secao>
          ))}
      </>
    );
  }

  function renderConteudo() {
    if (carregando) {
      return (
        <div className="cat-status" role="status">
          <span className="cat-spinner" aria-hidden /> Carregando categorias…
        </div>
      );
    }
    if (erro) return <p className="cat-status cat-status--erro">{erro}</p>;
    if (termo) return renderBusca();
    if (selecionada === NOVIDADES) {
      const novos = [...produtos].sort((a, b) => b.criadoEm - a.criadoEm).slice(0, 18);
      return (
        <Secao titulo="Novidades">
          <ItensProdutos lista={novos} />
        </Secao>
      );
    }
    if (principalAtual) return renderPrincipal(principalAtual);
    if (subAtual) return renderSub(subAtual);
    return renderParaVoce();
  }

  const chaveAtiva = principalDoMenu ? principalDoMenu.slug : selecionada;
  const opcoes = [
    { chave: PARA_VOCE, nome: "Para você" },
    { chave: NOVIDADES, nome: "Novidades" },
    ...arvore.map((p) => ({ chave: p.slug, nome: p.nome })),
  ];

  return (
    <div className="cat-page">
      <header className="cat-top">
        <h1>
          <i className="fas fa-th-large" aria-hidden /> Categorias
        </h1>
        <label className="cat-search">
          <i className="fas fa-search" aria-hidden />
          <input
            type="search"
            placeholder="Buscar produtos ou categorias"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar produtos ou categorias"
          />
        </label>
      </header>

      <div className="cat-layout">
        <nav className="cat-side" aria-label="Categorias">
          {opcoes.map((o) => (
            <button
              key={o.chave}
              type="button"
              className={`cat-side__item${!termo && chaveAtiva === o.chave ? " is-active" : ""}`}
              onClick={() => selecionar(o.chave)}
            >
              {o.nome}
            </button>
          ))}
        </nav>

        <div className="cat-main">{renderConteudo()}</div>
      </div>
    </div>
  );
}
