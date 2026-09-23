import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ADMIN_METRICS_CHANGED,
  EMPTY_METRICS,
  fetchAdminMetrics,
} from "../../utils/adminMetrics";
import { ADMIN_NAV } from "../../utils/adminDashboardMock";
import { listTodosPedidos } from "../../services/pedidosApi";
import { formatBRL } from "../../utils/cartHelpers";
import "./style.css";
import "./admin-crud.css";

export { ADMIN_NAV };

export default function AdminHome() {
  const location = useLocation();
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [recentLojistas, setRecentLojistas] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [apiOk, setApiOk] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const refreshMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [data, pedidos] = await Promise.all([
        fetchAdminMetrics(),
        listTodosPedidos().catch(() => []),
      ]);
      setMetrics(data.metrics);
      setRecentLojistas(data.recentLojistas);
      setRecentOrders(
        (pedidos || [])
          .slice()
          .sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")))
          .slice(0, 5)
          .map((p) => ({
            id: `#AY-${p.id}`,
            loja: p.usuario?.nome || "Cliente",
            valor: formatBRL(Number(p.valorTotal) || 0),
            status: String(p.status || "").toLowerCase(),
          })),
      );
      setApiOk(true);
    } catch {
      setMetrics(EMPTY_METRICS);
      setRecentLojistas([]);
      setRecentOrders([]);
      setApiOk(false);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (location.pathname !== "/admin") return;
    refreshMetrics();
  }, [location.pathname, location.key, refreshMetrics]);

  useEffect(() => {
    const onChanged = () => refreshMetrics();
    window.addEventListener(ADMIN_METRICS_CHANGED, onChanged);
    return () => window.removeEventListener(ADMIN_METRICS_CHANGED, onChanged);
  }, [refreshMetrics]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Visão geral</h1>
          <p>Resumo do marketplace AYVY — lojistas, clientes e produtos em tempo real.</p>
          {!apiOk ? (
            <p className="admin-crud-hint" style={{ color: "#b45309", marginTop: 8 }}>
              API offline — métricas indisponíveis. Suba o back em :8082.
            </p>
          ) : null}
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/usuarios" className="admin-btn admin-btn--ghost">
            Usuários
          </Link>
          <Link to="/admin/lojistas" className="admin-btn admin-btn--ghost">
            Lojistas
          </Link>
          <Link to="/admin/produtos" className="admin-btn admin-btn--ghost">
            Produtos
          </Link>
          <Link to="/" className="admin-btn admin-btn--primary">
            Ver vitrine pública
          </Link>
        </div>
      </header>

      <section className="admin-card admin-card--hero">
        <div className="admin-hero-preview">
          <div className="admin-hero-preview-inner">
            <span className="admin-hero-preview-logo">AYVY</span>
            <small>Marketplace</small>
          </div>
        </div>
        <div className="admin-hero-info">
          <div className="admin-hero-title-row">
            <h2>AYVY Marketplace</h2>
            <span className="admin-badge admin-badge--live">
              <i className="fas fa-circle" aria-hidden /> {apiOk ? "API online" : "API offline"}
            </span>
          </div>
          <ul className="admin-hero-meta">
            <li>
              <span>Ambiente</span>
              <strong>Desenvolvimento local</strong>
            </li>
            <li>
              <span>Front</span>
              <strong>localhost:5173</strong>
            </li>
            <li>
              <span>API</span>
              <strong>localhost:8082</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="admin-metrics-row" aria-busy={loadingMetrics}>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Lojistas cadastrados</span>
          <strong className="admin-stat-value">
            {loadingMetrics ? "…" : metrics.lojistasCadastrados}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Aguardando aprovação</span>
          <strong className="admin-stat-value admin-stat-value--warn">
            {loadingMetrics ? "…" : metrics.lojistasPendentes}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Produtos cadastrados</span>
          <strong className="admin-stat-value">
            {loadingMetrics ? "…" : metrics.produtosCadastrados}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Clientes cadastrados</span>
          <strong className="admin-stat-value">
            {loadingMetrics ? "…" : metrics.clientesCadastrados}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pedidos (lista)</span>
          <strong className="admin-stat-value">
            {loadingMetrics ? "…" : recentOrders.length}
          </strong>
        </article>
      </section>
      {apiOk ? (
        <p className="admin-metrics-hint">
          Números vêm da API. Perfil de cliente ou loja é criado em{" "}
          <Link to="/admin/clientes">Clientes</Link> / <Link to="/admin/lojistas">Lojistas</Link>{" "}
          (não basta só cadastrar usuário).
        </p>
      ) : null}

      <div className="admin-two-col">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Lojistas na plataforma</h2>
          </div>
          {recentLojistas.length === 0 ? (
            <p className="admin-crud-loading">Nenhum lojista na API.</p>
          ) : (
            <ul className="admin-lojista-list">
              {recentLojistas.map((loja) => (
                <li key={loja.slug || loja.id}>
                  <img src={loja.avatar} alt="" />
                  <div className="admin-lojista-info">
                    <strong>{loja.name}</strong>
                    <span>{loja.handle}</span>
                  </div>
                  <span className="admin-lojista-products">{loja.products} produtos</span>
                  <span
                    className={`admin-badge admin-badge--sm ${
                      loja.status === "aprovado" ? "admin-badge--live" : "admin-badge--pending"
                    }`}
                  >
                    {loja.status === "aprovado" ? "Aprovado" : "Pendente"}
                  </span>
                  {loja.slug ? (
                    <Link to={`/loja/${loja.slug}`} className="admin-link-btn">
                      Ver loja
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="admin-link-btn">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-crud-loading">Nenhum pedido na API.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.loja}</td>
                    <td>{order.valor}</td>
                    <td>
                      <span className={`admin-order-status admin-order-status--${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
