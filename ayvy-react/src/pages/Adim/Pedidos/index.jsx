import { useCallback, useEffect, useMemo, useState } from "react";
import TrackingTimeline from "../../../components/TrackingTimeline";
import { useAuth } from "../../../context/AuthContext";
import {
  atualizarNotificacao,
  listNotificacoesDoUsuario,
} from "../../../services/notificacoesApi";
import {
  atualizarStatusPedido,
  getPedidoEndereco,
  getPedidoHistorico,
  getPedidoItens,
  listPagamentos,
  listTodosPedidos,
} from "../../../services/pedidosApi";
import { formatBRL } from "../../../utils/cartHelpers";
import { numeroPedidoLabel } from "../../../utils/pedidoNumero";
import "../admin-crud.css";
import "../style.css";
import "./pedidos.css";

const POLL_MS = 15000;

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "aguardando_pagamento", label: "Aguardando" },
  { value: "pago", label: "Pago" },
  { value: "em_separacao", label: "Em preparo" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

const STATUS_LABEL = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em preparo",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const EVENTO_LABEL = {
  PEDIDO_CRIADO: "Pedido criado",
  PEDIDO_RECEBIDO: "Loja confirmou o recebimento",
  PEDIDO_DESPACHADO: "Pedido despachado",
  ENTREGA_CONFIRMADA: "Cliente confirmou a entrega",
  STATUS_ALTERADO: "Status alterado",
};

const STATUS_EM_ANDAMENTO = new Set(["pago", "em_separacao", "enviado"]);

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}

function formatEndereco(e) {
  if (!e) return "—";
  const parts = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join(" — "),
    e.cep ? `CEP ${e.cep}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function formatPagamentoTipo(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t === "pix") return "Pix";
  if (t === "cartao_credito" || t === "credito") return "Cartão de crédito";
  if (t === "cartao_debito" || t === "debito") return "Cartão de débito";
  if (t === "boleto") return "Boleto";
  if (!t) return "—";
  return String(tipo);
}

function lojasDosItens(itens) {
  return [
    ...new Set(
      (itens || [])
        .map((i) => i?.lojista?.nomeLoja || i?.produto?.lojista?.nomeLoja || "")
        .filter(Boolean),
    ),
  ];
}

function itemLabel(i) {
  const variacao = [i?.cor, i?.tamanho].filter(Boolean).join(" / ");
  const codigo = i?.codigoPedidoLoja ? ` (#${i.codigoPedidoLoja})` : "";
  return `${i.quantidade}× ${i.produto?.nome || "Produto"}${variacao ? ` — ${variacao}` : ""}${codigo}`;
}

function mapApiPedido(p, { itens, pagamentoTipo, endereco }) {
  const status = String(p.status || "").toLowerCase();
  return {
    apiId: p.id,
    id: numeroPedidoLabel(itens, p.id),
    criadoEm: formatWhen(p.criadoEm),
    status,
    lojas: lojasDosItens(itens),
    valor: formatBRL(Number(p.valorTotal) || 0),
    frete: formatBRL(Number(p.valorFrete) || 0),
    itens: (itens || []).map(itemLabel),
    pagamento: formatPagamentoTipo(pagamentoTipo),
    observacaoCliente: p.observacao || "",
    etapaEnvio: p.etapaEnvio || null,
    envioIniciadoEm:
      p.segundosDesdeEnvio != null ? Date.now() - Number(p.segundosDesdeEnvio) * 1000 : null,
    envio: {
      localPostagem: p.localPostagem || "",
      transportadora: p.transportadora || "",
      codigoRastreio: p.codigoRastreio || "",
      recebidoEm: formatWhen(p.recebidoEm),
      enviadoEm: formatWhen(p.enviadoEm),
      entregueEm: formatWhen(p.entregueEm),
    },
    cliente: {
      nome: p.usuario?.nome || "Cliente",
      email: p.usuario?.email || "—",
      telefone: p.usuario?.telefone || "—",
      endereco: endereco || "—",
    },
  };
}

async function carregarPedidosAdmin() {
  const [list, pags] = await Promise.all([
    listTodosPedidos(),
    listPagamentos().catch(() => []),
  ]);
  const pagByPedido = {};
  for (const pag of pags || []) {
    const pid = pag?.pedido?.id ?? pag?.pedidoId;
    if (pid != null) pagByPedido[pid] = pag.tipo;
  }
  const cards = await Promise.all(
    (list || []).map(async (p) => {
      const [itens, endereco] = await Promise.all([
        getPedidoItens(p.id).catch(() => []),
        getPedidoEndereco(p.id)
          .then(formatEndereco)
          .catch(() => "—"),
      ]);
      return mapApiPedido(p, { itens, pagamentoTipo: pagByPedido[p.id], endereco });
    }),
  );
  return cards.sort((a, b) => b.apiId - a.apiId);
}

function HistoricoPedido({ pedidoId }) {
  const [eventos, setEventos] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPedidoHistorico(pedidoId)
      .then((list) => {
        if (!cancelled) setEventos(list || []);
      })
      .catch((e) => {
        if (!cancelled) setErro(e.message || "Erro ao carregar histórico");
      });
    return () => {
      cancelled = true;
    };
  }, [pedidoId]);

  if (erro) return <p className="admin-pedido-hist-erro">{erro}</p>;
  if (!eventos) return <p className="admin-pedido-hist-vazio">Carregando histórico…</p>;
  if (eventos.length === 0) return <p className="admin-pedido-hist-vazio">Sem eventos registrados.</p>;

  return (
    <ol className="admin-pedido-hist">
      {eventos.map((ev) => (
        <li key={ev.id}>
          <span className="admin-pedido-hist-when">{formatWhen(ev.criadoEm)}</span>
          <strong>{EVENTO_LABEL[ev.evento] || ev.evento}</strong>
          <span>{ev.descricao}</span>
          {ev.actorUsuario?.nome ? (
            <span className="admin-pedido-hist-actor">por {ev.actorUsuario.nome}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default function AdminPedidosList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historicoAberto, setHistoricoAberto] = useState({});
  const [atividades, setAtividades] = useState([]);

  const adminId = user?.id;

  const recarregar = useCallback(async () => {
    try {
      const [cards, notifs] = await Promise.all([
        carregarPedidosAdmin(),
        adminId ? listNotificacoesDoUsuario(adminId).catch(() => []) : [],
      ]);
      setPedidos(cards);
      setAtividades(
        (notifs || [])
          .filter((n) => String(n.tipo || "").startsWith("pedido"))
          .sort((a, b) => b.id - a.id)
          .slice(0, 15),
      );
      setError("");
    } catch (e) {
      setError(e.message || "Erro ao carregar pedidos da API");
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    const primeiro = setTimeout(recarregar, 0);
    const timer = setInterval(recarregar, POLL_MS);
    return () => {
      clearTimeout(primeiro);
      clearInterval(timer);
    };
  }, [recarregar]);

  const filtered = useMemo(() => {
    if (!statusFilter) return pedidos;
    return pedidos.filter((p) => p.status === statusFilter);
  }, [pedidos, statusFilter]);

  const pendentes = pedidos.filter((p) => p.status === "aguardando_pagamento").length;
  const emAndamento = pedidos.filter((p) => STATUS_EM_ANDAMENTO.has(p.status)).length;
  const entregues = pedidos.filter((p) => p.status === "entregue").length;
  const novasAtividades = atividades.filter((n) => !n.lida).length;

  async function marcarPago(pedido) {
    try {
      await atualizarStatusPedido(pedido.apiId, "pago", user?.id);
      await recarregar();
    } catch (e) {
      setError(e.message || "Falha ao atualizar status");
    }
  }

  async function marcarAtividadesLidas() {
    const naoLidas = atividades.filter((n) => !n.lida);
    await Promise.all(
      naoLidas.map((n) =>
        atualizarNotificacao(n.id, {
          titulo: n.titulo,
          mensagem: n.mensagem,
          tipo: n.tipo,
          lida: true,
        }).catch(() => null),
      ),
    );
    await recarregar();
  }

  function toggleHistorico(apiId) {
    setHistoricoAberto((prev) => ({ ...prev, [apiId]: !prev[apiId] }));
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Acompanhe todos os pedidos: cliente, loja, pagamento, envio e entrega.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={recarregar}>
            Atualizar
          </button>
          <span className="admin-pedidos-live">
            <span className="admin-pedidos-live-dot" aria-hidden />
            Ao vivo
          </span>
        </div>
      </header>

      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

      <section className="admin-metrics-row admin-pedidos-metrics">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Total</span>
          <strong className="admin-stat-value">{pedidos.length}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Aguardando pagamento</span>
          <strong className="admin-stat-value admin-stat-value--warn">{pendentes}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Em andamento</span>
          <strong className="admin-stat-value">{emAndamento}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Entregues</span>
          <strong className="admin-stat-value">{entregues}</strong>
        </article>
      </section>

      <section className="admin-card admin-atividades">
        <div className="admin-card-head">
          <h2>
            Atividade recente
            {novasAtividades > 0 ? (
              <span className="admin-atividades-badge">{novasAtividades} nova(s)</span>
            ) : null}
          </h2>
          {novasAtividades > 0 ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={marcarAtividadesLidas}>
              Marcar como lidas
            </button>
          ) : null}
        </div>
        {atividades.length === 0 ? (
          <p className="admin-crud-loading">
            Nenhuma atividade ainda. Novos pedidos, despachos e entregas aparecem aqui.
          </p>
        ) : (
          <ul className="admin-atividades-list">
            {atividades.map((n) => (
              <li key={n.id} className={n.lida ? "" : "is-nova"}>
                <strong>{n.titulo}</strong>
                <span>{n.mensagem}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Pedidos</h2>
          <div className="admin-pedidos-filters" role="group" aria-label="Filtrar por status">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value || "todos"}
                type="button"
                className={`admin-pedidos-filter${statusFilter === opt.value ? " is-active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="admin-crud-loading">Carregando…</p> : null}

        <ul className="admin-pedidos-feed">
          {filtered.map((pedido) => (
            <li key={pedido.apiId} className="admin-pedido-card">
              <div className="admin-pedido-card-top">
                <div>
                  <strong className="admin-pedido-id">{pedido.id}</strong>
                  <span className="admin-pedido-when">
                    {pedido.cliente.nome} comprou em {pedido.lojas.join(", ") || "—"} · {pedido.criadoEm}
                  </span>
                </div>
                <span className={`admin-order-status admin-order-status--${pedido.status}`}>
                  {STATUS_LABEL[pedido.status] || pedido.status}
                </span>
              </div>

              <div className="admin-pedido-grid">
                <div className="admin-pedido-block">
                  <h3>Cliente</h3>
                  <p>
                    <i className="fas fa-user" aria-hidden />
                    <strong>{pedido.cliente.nome}</strong>
                  </p>
                  <p>
                    <i className="fas fa-envelope" aria-hidden />
                    {pedido.cliente.email}
                  </p>
                  <p>
                    <i className="fas fa-phone" aria-hidden />
                    {pedido.cliente.telefone}
                  </p>
                  <p>
                    <i className="fas fa-map-marker-alt" aria-hidden />
                    {pedido.cliente.endereco}
                  </p>
                  {pedido.observacaoCliente ? (
                    <p>
                      <i className="fas fa-comment" aria-hidden />
                      {pedido.observacaoCliente}
                    </p>
                  ) : null}
                </div>

                <div className="admin-pedido-block">
                  <h3>Pedido</h3>
                  <p>
                    <i className="fas fa-store" aria-hidden />
                    {pedido.lojas.join(", ") || "—"}
                  </p>
                  {pedido.itens.map((label) => (
                    <p key={label}>
                      <i className="fas fa-box" aria-hidden />
                      {label}
                    </p>
                  ))}
                  <p className="admin-pedido-valor">
                    <i className="fas fa-tag" aria-hidden />
                    {pedido.valor} <small>(frete {pedido.frete})</small>
                  </p>
                  <p>
                    <i className="fas fa-wallet" aria-hidden />
                    {pedido.pagamento}
                  </p>
                  {pedido.status === "aguardando_pagamento" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={() => marcarPago(pedido)}
                    >
                      Marcar como pago
                    </button>
                  ) : null}
                </div>

                <div className="admin-pedido-block">
                  <h3>Envio</h3>
                  {pedido.envio.recebidoEm ? (
                    <p>
                      <i className="fas fa-check" aria-hidden />
                      Recebido pela loja em {pedido.envio.recebidoEm}
                    </p>
                  ) : null}
                  {pedido.envio.localPostagem ? (
                    <p>
                      <i className="fas fa-map-pin" aria-hidden />
                      Pacote deixado em {pedido.envio.localPostagem}
                    </p>
                  ) : null}
                  {pedido.envio.enviadoEm ? (
                    <p>
                      <i className="fas fa-truck" aria-hidden />
                      Despachado em {pedido.envio.enviadoEm}
                    </p>
                  ) : null}
                  {pedido.envio.transportadora || pedido.envio.codigoRastreio ? (
                    <p>
                      <i className="fas fa-barcode" aria-hidden />
                      {[pedido.envio.transportadora, pedido.envio.codigoRastreio]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  {pedido.envio.entregueEm ? (
                    <p>
                      <i className="fas fa-flag-checkered" aria-hidden />
                      Entrega confirmada em {pedido.envio.entregueEm}
                    </p>
                  ) : null}
                  {!pedido.envio.recebidoEm && !pedido.envio.enviadoEm && !pedido.envio.entregueEm ? (
                    <p>
                      <i className="fas fa-hourglass-half" aria-hidden />
                      Ainda não despachado
                    </p>
                  ) : null}
                </div>
              </div>

              {pedido.status !== "aguardando_pagamento" ? (
                <div className="admin-pedido-tracking">
                  <TrackingTimeline
                    etapa={pedido.etapaEnvio}
                    envioIniciadoEm={pedido.envioIniciadoEm}
                    onEtapaChange={recarregar}
                  />
                </div>
              ) : null}

              <div className="admin-pedido-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => toggleHistorico(pedido.apiId)}
                >
                  {historicoAberto[pedido.apiId] ? "Ocultar histórico" : "Ver histórico"}
                </button>
              </div>
              {historicoAberto[pedido.apiId] ? <HistoricoPedido pedidoId={pedido.apiId} /> : null}
            </li>
          ))}
        </ul>

        {!loading && filtered.length === 0 ? (
          <p className="admin-crud-loading">Nenhum pedido com esse status.</p>
        ) : null}
      </section>
    </div>
  );
}
