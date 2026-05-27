import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_NAV } from "../../utils/adminDashboardMock";
import "./style.css";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = "page-admin";
    return () => {
      document.body.className = "";
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link to="/admin" className="admin-brand">
            <span className="admin-brand-logo">AYVY</span>
            <span className="admin-brand-sub">Painel Admin</span>
          </Link>
          <button type="button" className="admin-quick-add" disabled title="Em breve">
            <i className="fas fa-plus" aria-hidden /> Cadastro rápido
          </button>
        </div>

        <p className="admin-user">
          <i className="fas fa-user-shield" aria-hidden />
          {user?.displayName || "Administrador"}
        </p>

        <nav className="admin-nav">
          {ADMIN_NAV.map((item) =>
            item.soon ? (
              <span key={item.to} className="admin-nav-link admin-nav-link--soon" title="Em breve">
                <i className={`fas ${item.icon}`} aria-hidden />
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-nav-link${isActive ? " is-active" : ""}`
                }
              >
                <i className={`fas ${item.icon}`} aria-hidden />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-footer-link">
            <i className="fas fa-external-link-alt" aria-hidden /> Ver site público
          </Link>
          <button type="button" className="admin-footer-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" aria-hidden /> Sair
          </button>
        </div>
      </aside>

      <div className="admin-content-wrap">
        <Outlet />
      </div>
    </div>
  );
}
