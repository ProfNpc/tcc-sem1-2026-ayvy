import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import scrollToSupportSection from "../../utils/scrollToSupport";
import LogoutModal from "../LogoutModal";
import NavCartButton from "../NavCartButton";
import NavbarMobile from "../NavbarMobile";
import "./style.css";

export default function Navbar() {
  const { loggedIn, logout, isAdmin, isLojista, isCliente, shopSlug } = useAuth();
  const minhaLojaPath = shopSlug ? `/loja/${shopSlug}` : "/";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function confirmLogout() {
    setLogoutOpen(false);
    logout();
    navigate("/", { replace: true });
  }

  return (
    <>
      <header className="navbar-top-fixed">
        <div className="nav-left">
          <div className="menu-container-sensor">
            <i className="fas fa-bars hamburguer-icon" aria-hidden />
            <nav className="gaveta-flutuante">
              <ul className="nav-links">
                <li>
                  <Link to="/">
                    <i className="fas fa-home" /> Início
                  </Link>
                </li>
                <li style={{ display: isAdmin ? "" : "none" }}>
                  <Link to="/admin">
                    <i className="fas fa-shield-alt" /> Painel admin
                  </Link>
                </li>
                <li style={{ display: isLojista && loggedIn ? "" : "none" }}>
                  <Link to="/perfil">
                    <i className="fas fa-user-circle" /> Meu perfil
                  </Link>
                </li>
                <li style={{ display: isLojista ? "" : "none" }}>
                  <Link to={minhaLojaPath}>
                    <i className="fas fa-store" /> Minha loja
                  </Link>
                </li>
                <li style={{ display: isCliente && loggedIn ? "" : "none" }}>
                  <Link to="/perfil">
                    <i className="fas fa-user-circle" /> Perfil
                  </Link>
                </li>
                <li>
                  <Link to="/sobre">
                    <i className="fas fa-info-circle" /> Sobre
                  </Link>
                </li>
                <li style={{ display: loggedIn ? "" : "none" }}>
                  <button
                    type="button"
                    className="nav-link-like"
                    onClick={() => setLogoutOpen(true)}
                  >
                    <i className="fas fa-sign-out-alt" /> Sair
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <Link className="logo-brand" to="/">
            AYVY
          </Link>

          <Link to="/sobre" className="nav-link-top">
            Sobre
          </Link>
          <a
            href="#"
            className="nav-link-top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSupportSection();
            }}
          >
            Suporte AYVY
          </a>
          <a
            href="#"
            className="nav-link-top"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            Baixe o App
          </a>
        </div>

        <div className="nav-right">
          <Link
            id="btn-login"
            to="/login"
            className="btn-round"
            style={{ display: loggedIn ? "none" : undefined }}
          >
            Fazer login
          </Link>
          <Link
            id="btn-cadastro"
            to="/cadastro"
            className="btn-round purple"
            style={{ display: loggedIn ? "none" : undefined }}
          >
            Cadastre-se
          </Link>

          <NavCartButton id="navCartIcon" />
        </div>
      </header>

      <NavbarMobile
        key={location.pathname}
        loggedIn={loggedIn}
        isAdmin={isAdmin}
        isLojista={isLojista}
        isCliente={isCliente}
        minhaLojaPath={minhaLojaPath}
        onLogoutRequest={() => setLogoutOpen(true)}
      />

      <LogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
