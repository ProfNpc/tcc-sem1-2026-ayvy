import { useMemo, useState } from "react";
import { listOrders, orderToAdminCard } from "../../../utils/ordersStore";
import "../admin-crud.css";
import "../style.css";
import "./pedidos.css";

/** Dados fictícios de exemplo — pedidos reais do checkout entram pelo localStorage. */
const PEDIDOS_MOCK = [
  {
    id: "#AY-1048",
    criadoEm: "Agora · há 2 min",
    status: "pago",
    loja: "ITB Moda",
    valor: "R$ 189,90",
    itens: "1× Camiseta Oversized Preta",
    cliente: {
      nome: "Ana Souza",
      email: "ana.souza@email.com",
      cpf: "123.456.789-00",
      telefone: "(11) 98765-4321",
      endereco: "Rua das Flores, 120 — Apt 42 — São Paulo, SP — 01310-100",
    },
  },
  {
    id: "#AY-1047",
    criadoEm: "Hoje · 18:42",
    status: "enviado",
    loja: "Rafaele Fashion",
    valor: "R$ 349,80",
    itens: "2× Vestido Midi Floral",
    cliente: {
      nome: "Bruno Lima",
      email: "bruno.lima@email.com",
      cpf: "987.654.321-11",
      telefone: "(11) 97654-3210",
      endereco: "Av. Paulista, 1500 — Sala 8 — São Paulo, SP — 01310-200",
    },
  },
  {
    id: "#AY-1046",
    criadoEm: "Hoje · 15:10",
    status: "pendente",
    loja: "Livre Store",
    valor: "R$ 79,90",
    itens: "1× Boné AYVY Classic",
    cliente: {
      nome: "Carla Mendes",
      email: "carla.mendes@email.com",
      cpf: "456.789.123-22",
      telefone: "(21) 99876-5432",
      endereco: "Rua do Catete, 88 — Rio de Janeiro, RJ — 22220-000",
    },
  },
  {
    id: "#AY-1045",
    criadoEm: "Ontem · 21:05",
    status: "pago",
    loja: "ITB Moda",
    valor: "R$ 229,72",
    itens: "1× Calça Wide Leg + frete",
    cliente: {
      nome: "Diego Martins",
      email: "diego.martins@email.com",
      cpf: "321.654.987-33",
      telefone: "(31) 91234-5678",
      endereco: "Rua da Bahia, 450 — Belo Horizonte, MG — 30160-011",
    },
  },
  {
    id: "#AY-1044",
    criadoEm: "Ontem · 11:30",
    status: "enviado",
    loja: "Rafaele Fashion",
    valor: "R$ 520,00",
    itens: "1× Jaqueta Couro Eco",
    cliente: {
      nome: "Elena Costa",
      email: "elena.costa@email.com",
      cpf: "159.753.486-44",
      telefone: "(41) 98521-4477",
      endereco: "Rua XV de Novembro, 700 — Curitiba, PR — 80020-310",
    },
  },
];

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pago", label: "Pago" },
  { value: "enviado", label: "Enviado" },
  { value: "pendente", label: "Pendente" },
];

export default function AdminPedidosList() {
  const [statusFilter, setStatusFilter] = useState("");
  const [tick, setTick] = useState(0);

  const allPedidos = useMemo(() => {
    const fromCheckout = listOrders().map(orderToAdminCard);
    const ids = new Set(fromCheckout.map((p) => p.id));
    const mockRest = PEDIDOS_MOCK.filter((p) => !ids.has(p.id));
    return [...fromCheckout, ...mockRest];
  }, [tick]);

  const pedidos = useMemo(() => {
    if (!statusFilter) return allPedidos;
    return allPedidos.filter((p) => p.status === statusFilter);
  }, [allPedidos, statusFilter]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Pedidos</h1>
          <p>
            Pedidos do checkout (mock no navegador) aparecem no topo. Os demais são
            exemplos de layout.
          </p>
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
            Checkout mock
          </span>
        </div>
      </header>

      <section className="admin-metrics-row admin-pedidos-metrics">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pedidos hoje</span>
          <strong className="admin-stat-value">3</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pendentes</span>
          <strong className="admin-stat-value admin-stat-value--warn">1</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pagos / enviados</span>
          <strong className="admin-stat-value">4</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Total na lista</span>
          <strong className="admin-stat-value">{allPedidos.length}</strong>
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

        <ul className="admin-pedidos-feed">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="admin-pedido-card">
              <div className="admin-pedido-card-top">
                <div>
                  <strong className="admin-pedido-id">{pedido.id}</strong>
                  <span className="admin-pedido-when">{pedido.criadoEm}</span>
                </div>
                <span className={`admin-order-status admin-order-status--${pedido.status}`}>
                  {pedido.status}
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
                    <i className="fas fa-id-card" aria-hidden />
                    CPF {pedido.cliente.cpf}
                  </p>
                  <p>
                    <i className="fas fa-phone" aria-hidden />
                    {pedido.cliente.telefone}
                  </p>
                </div>

                <div className="admin-pedido-block">
                  <h3>Entrega</h3>
                  <p className="admin-pedido-endereco">
                    <i className="fas fa-map-marker-alt" aria-hidden />
                    {pedido.cliente.endereco}
                  </p>
                </div>

                <div className="admin-pedido-block">
                  <h3>Pedido</h3>
                  <p>
                    <i className="fas fa-store" aria-hidden />
                    {pedido.loja}
                  </p>
                  <p>
                    <i className="fas fa-box" aria-hidden />
                    {pedido.itens}
                  </p>
                  <p className="admin-pedido-valor">
                    <i className="fas fa-tag" aria-hidden />
                    {pedido.valor}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {pedidos.length === 0 ? (
          <p className="admin-crud-loading">Nenhum pedido com esse status.</p>
        ) : null}
      </section>
    </div>
  );
}
