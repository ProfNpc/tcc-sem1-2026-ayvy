import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  atualizarStatusPedido,
  getPedidoItens,
  listTodosPedidos,
} from "../../../services/pedidosApi";
import { formatBRL } from "../../../utils/cartHelpers";
import "../admin-crud.css";
import "../style.css";
import "./pedidos.css";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "aguardando_pagamento", label: "Aguardando" },
  { value: "pago", label: "Pago" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}

function mapApiPedido(p, itensLabel) {
  const status = String(p.status || "").toLowerCase();
  return {
    apiId: p.id,
    id: `#AY-${p.id}`,
    criadoEm: formatWhen(p.criadoEm),
    status: status === "aguardando_pagamento" ? "pendente" : status,
    rawStatus: status,
    loja: "Marketplace",
    valor: formatBRL(Number(p.valorTotal) || 0),
    itens: itensLabel || "—",
    cliente: {
      nome: p.usuario?.nome || "Cliente",
      email: p.usuario?.email || "—",
      cpf: "—",
      telefone: p.usuario?.telefone || "—",
      endereco: "Ver endereço no pedido",
    },
  };
}

export default function AdminPedidosList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await listTodosPedidos();
        const cards = await Promise.all(
          (list || []).map(async (p) => {
            let itensLabel = "—";
            try {
              const itens = await getPedidoItens(p.id);
              itensLabel = (itens || [])
                .map((i) => `${i.quantidade}× ${i.produto?.nome || "Produto"}`)
                .join(" · ");
            } catch {
              /* ignore */
            }
            return mapApiPedido(p, itensLabel);
          }),
        );
        if (!cancelled) setPedidos(cards);
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar pedidos da API");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const filtered = useMemo(() => {
    if (!statusFilter) return pedidos;
    return pedidos.filter(
      (p) => p.status === statusFilter || p.rawStatus === statusFilter,
    );
  }, [pedidos, statusFilter]);

  const pendentes = pedidos.filter(
    (p) => p.rawStatus === "aguardando_pagamento" || p.status === "pendente",
  ).length;

  async function marcarPago(pedido) {
    if (!pedido.apiId) return;
    try {
      await atualizarStatusPedido(pedido.apiId, "pago", user?.id);
      setTick((t) => t + 1);
    } catch (e) {
      alert(e.message || "Falha ao atualizar status");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Pedidos vindos da API Spring Boot (`GET /pedidos/all`).</p>
        </div>
        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setTick((t) => t + 1)}
          >
            Atualizar
          </button>
          <span className="admin-pedidos-live">
            <span className="admin-pedidos-live-dot" aria-hidden />
            API live
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
          <span className="admin-stat-label">Pendentes</span>
          <strong className="admin-stat-value admin-stat-value--warn">{pendentes}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Na lista filtrada</span>
          <strong className="admin-stat-value">{filtered.length}</strong>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Últimos pedidos</h2>
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
            <li key={pedido.id} className="admin-pedido-card">
              <div className="admin-pedido-card-top">
                <div>
                  <strong className="admin-pedido-id">{pedido.id}</strong>
                  <span className="admin-pedido-when">{pedido.criadoEm}</span>
                </div>
                <span className={`admin-order-status admin-order-status--${pedido.status}`}>
                  {pedido.rawStatus || pedido.status}
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
                </div>

                <div className="admin-pedido-block">
                  <h3>Pedido</h3>
                  <p>
                    <i className="fas fa-box" aria-hidden />
                    {pedido.itens}
                  </p>
                  <p className="admin-pedido-valor">
                    <i className="fas fa-tag" aria-hidden />
                    {pedido.valor}
                  </p>
                  {pedido.rawStatus === "aguardando_pagamento" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={() => marcarPago(pedido)}
                    >
                      Marcar como pago
                    </button>
                  ) : null}
                </div>
              </div>
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
