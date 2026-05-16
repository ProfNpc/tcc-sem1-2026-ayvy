import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import scrollToSupportSection from "../../utils/scrollToSupport";
import "./style.css";

export default function NavbarMobile({
  loggedIn,
  onLogoutRequest,
  cartCount,
  onCartClick,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="navbar-top-fixed mobile-only">
      <div
        className={`mobile-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
        role="presentation"
      />
      <div className="nav-left">
        <div className="menu-container-sensor">
          <i
            className="fas fa-bars hamburguer-icon"
            onClick={() => setMobileOpen((v) => !v)}
            role="presentation"
          />
          <nav
            className={`gaveta-flutuante ${mobileOpen ? "open" : ""}`}
            id="mobileMenu"
          >
            <div className="gaveta-header">
              <span className="logo-brand-mobile">AYVY</span>
              <i
                className="fas fa-times close-menu"
                onClick={() => setMobileOpen(false)}
                role="presentation"
              />
            </div>

            <ul className="nav-links">
              <li>
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  <i className="fas fa-home" /> Início
                </Link>
              </li>
              <li style={{ display: loggedIn ? "" : "none" }}>
                <Link to="/perfil" onClick={() => setMobileOpen(false)}>
                  <i className="fas fa-user-circle" /> Perfil
                </Link>
              </li>
              <li>
                <Link to="/sobre" onClick={() => setMobileOpen(false)}>
                  <i className="fas fa-info-circle" /> Sobre
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="nav-link-like"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    scrollToSupportSection();
                  }}
                >
                  <i className="fas fa-question-circle" /> Suporte AYVY
                </a>
              </li>
              <li style={{ display: loggedIn ? "" : "none" }}>
                <button
                  type="button"
                  className="nav-link-like"
                  onClick={() => {
                    onLogoutRequest();
                    setMobileOpen(false);
                  }}
                >
                  <i className="fas fa-sign-out-alt" /> Sair
                </button>
              </li>
            </ul>

            <div className="mobile-buttons">
              <Link to="/login" className="btn-round" onClick={() => setMobileOpen(false)}>
                Fazer login
              </Link>
              <Link to="/cadastro" className="btn-round purple" onClick={() => setMobileOpen(false)}>
                Cadastre-se
              </Link>
              <Link
                id="navSairBtnMobile"
                to="#"
                className="btn-round btn-logout"
                style={{ display: loggedIn ? "" : "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  onLogoutRequest();
                  setMobileOpen(false);
                }}
              >
                Sair
              </Link>
            </div>
          </nav>
        </div>

        <Link className="logo-brand" to="/">
          AYVY
        </Link>
      </div>

      <div
        className="nav-cart-icon"
        id="navCartIconMobile"
        onClick={onCartClick}
        style={{ display: loggedIn ? "flex" : "none" }}
        title="Carrinho"
        role="presentation"
      >
        <i className="fas fa-shopping-cart" />
        <span id="cartCountMobile">{cartCount}</span>
      </div>
    </header>
  );
}
