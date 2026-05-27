import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./style.css";

export default function LojistaLayout() {
  const { logout, user, shopSlug } = useAuth();
  const navigate = useNavigate();
  const vitrinePath = shopSlug ? `/loja/${shopSlug}` : "/";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="panel-shell panel-shell--lojista">
      <aside className="panel-sidebar">
        <div className="panel-sidebar-brand">
          <span className="panel-logo">AYVY</span>
          <small>Painel do lojista</small>
        </div>
        <p className="panel-user">{user?.displayName || "Lojista"}</p>
        <nav className="panel-nav">
          <Link to="/lojista" className="panel-nav-link is-active">
            Início
          </Link>
          {shopSlug ? (
            <Link to={vitrinePath} className="panel-nav-link" target="_blank" rel="noreferrer">
              Ver vitrine
            </Link>
          ) : null}
        </nav>
        <div className="panel-sidebar-footer">
          <Link to="/" className="panel-link-muted">
            Voltar ao site
          </Link>
          <button type="button" className="panel-btn-logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="panel-main">
        <Outlet />
      </main>
    </div>
  );
}
