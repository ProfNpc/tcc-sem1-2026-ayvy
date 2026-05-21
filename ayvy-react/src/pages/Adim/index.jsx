import { Link } from "react-router-dom";
import { ADMIN_OVERVIEW } from "../../utils/adminDashboardMock";
import "./style.css";

function MetricRing({ percent }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="admin-ring" aria-hidden>
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#ece8f4" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--ayvy-purple, #b06edc)"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
      </svg>
      <span className="admin-ring-value">{percent}%</span>
    </div>
  );
}

function MiniChart({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div className="admin-mini-chart" role="img" aria-label="Visitas nos últimos 7 dias">
      {values.map((v, i) => (
        <span
          key={i}
          className="admin-mini-chart-bar"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function AdminHome() {
  const { platform, metrics, moderation, performance, recentLojistas, recentOrders } =
    ADMIN_OVERVIEW;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Visão geral da plataforma</h1>
          <p>Monitore lojistas, pedidos e a saúde do marketplace AYVY.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled>
            Ações
          </button>
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
            <h2>{platform.name}</h2>
            <span className="admin-badge admin-badge--live">
              <i className="fas fa-circle" aria-hidden /> Online
            </span>
          </div>
          <ul className="admin-hero-meta">
            <li>
              <span>Plano</span>
              <strong>{platform.plan}</strong>
            </li>
            <li>
              <span>Domínio</span>
              <strong>{platform.domain}</strong>
            </li>
            <li>
              <span>E-mail transacional</span>
              <strong>{platform.emailStatus}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="admin-metrics-row">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Lojistas ativos</span>
          <strong className="admin-stat-value">{metrics.lojistasAtivos}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Aguardando aprovação</span>
          <strong className="admin-stat-value admin-stat-value--warn">
            {metrics.lojistasPendentes}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Produtos publicados</span>
          <strong className="admin-stat-value">{metrics.produtosPublicados}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pedidos (mês)</span>
          <strong className="admin-stat-value">{metrics.pedidosMes}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Clientes</span>
          <strong className="admin-stat-value">{metrics.clientesCadastrados}</strong>
        </article>
        <article className="admin-stat-card admin-stat-card--highlight">
          <span className="admin-stat-label">Receita estimada (mês)</span>
          <strong className="admin-stat-value">{metrics.receitaMes}</strong>
        </article>
      </section>

      <section className="admin-card admin-card--moderation">
        <div className="admin-card-head">
          <h2>Moderação e configuração</h2>
          <button type="button" className="admin-link-btn" disabled>
            Ver painel completo →
          </button>
        </div>
        <div className="admin-moderation-grid">
          <div className="admin-moderation-item admin-moderation-item--ring">
            <MetricRing percent={moderation.checklistPercent} />
            <div>
              <strong>Checklist da plataforma</strong>
              <p>Itens essenciais para o TCC e go-live</p>
            </div>
          </div>
          <div className="admin-moderation-item">
            <span className="admin-metric-num admin-metric-num--danger">{moderation.issues}</span>
            <div>
              <strong>Problemas</strong>
              <p>Requerem ação do admin</p>
            </div>
          </div>
          <div className="admin-moderation-item">
            <span className="admin-metric-num">{moderation.recommendations}</span>
            <div>
              <strong>Recomendações</strong>
              <p>Melhorias sugeridas</p>
            </div>
          </div>
          <div className="admin-moderation-item">
            <span className="admin-metric-num admin-metric-num--ok">{moderation.completedTasks}</span>
            <div>
              <strong>Concluídas</strong>
              <p>Tarefas finalizadas</p>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Desempenho (7 dias)</h2>
          </div>
          <div className="admin-performance">
            <div>
              <span className="admin-perf-label">Visitas à plataforma</span>
              <MiniChart values={performance.visits7d} />
            </div>
            <div className="admin-perf-stats">
              <div>
                <span className="admin-perf-label">Uptime</span>
                <strong>{performance.uptime}%</strong>
                <div className="admin-progress">
                  <span style={{ width: `${performance.uptime}%` }} />
                </div>
              </div>
              <div>
                <span className="admin-perf-label">Taxa de conversão</span>
                <strong>{performance.conversionRate}%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Tarefas recentes</h2>
          </div>
          <ul className="admin-task-list">
            {moderation.tasks.map((task) => (
              <li key={task.id} className={task.done ? "is-done" : ""}>
                <span className={`admin-task-priority admin-task-priority--${task.priority}`}>
                  {task.priority}
                </span>
                <span className="admin-task-label">{task.label}</span>
                {task.done ? (
                  <i className="fas fa-check admin-task-check" aria-hidden />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="admin-two-col">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Lojistas na plataforma</h2>
          </div>
          <ul className="admin-lojista-list">
            {recentLojistas.map((loja) => (
              <li key={loja.slug}>
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
                <Link to={`/loja/${loja.slug}`} className="admin-link-btn">
                  Ver loja
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Pedidos recentes</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Loja</th>
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
        </section>
      </div>
    </div>
  );
}
