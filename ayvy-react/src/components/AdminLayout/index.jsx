import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./style.css";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="panel-shell panel-shell--admin">
      <aside className="panel-sidebar">
        <div className="panel-sidebar-brand">
          <span className="panel-logo">AYVY</span>
          <small>Administração</small>
        </div>
        <p className="panel-user">{user?.displayName || "Admin"}</p>
        <nav className="panel-nav">
          <Link to="/admin" className="panel-nav-link is-active">
            Início
          </Link>
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
