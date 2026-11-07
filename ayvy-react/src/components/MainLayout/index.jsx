/**
 * Layout de todas as telas públicas: Header (menu) + página (<Outlet />) + Footer padrão.
 * Também coloca a classe da página no <body> (page-home, page-sobre...) usada pelo CSS legado geral.css.
 * O style.css faz o rodapé ficar sempre no fim da tela (min-height + flex).
 */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../Footer";
import Header from "../Header";
import { cancelarRolagemSuporte } from "../../utils/scrollToSupport";
import "./style.css";

const PATH_CLASS = {
  "/": "page-home",
  "/sobre": "page-sobre",
  "/perfil": "page-perfil",
  "/ranking": "page-ranking",
};

export default function MainLayout() {
  const location = useLocation();
  const { pathname } = location;

  // Site de página única: sem isto, a nova tela abre na mesma rolagem da anterior
  // (ex.: do Suporte, lá embaixo na home, para o Sobre abria no fim do Sobre).
  // Com #ancora (ex.: /#support-section) quem rola é a própria página.
  useEffect(() => {
    if (location.hash) return;
    cancelarRolagemSuporte();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, location.hash]);

  useEffect(() => {
    let pageClass = PATH_CLASS[pathname] || "";
    if (pathname.startsWith("/loja")) {
      pageClass = "page-home page-loja-extra";
    }
    if (pathname.includes("/p/")) {
      pageClass = "page-home page-produto-extra";
    }
    document.body.className = ["has-ayvy-navbar", pageClass].filter(Boolean).join(" ");
    return () => {
      document.body.className = "";
    };
  }, [pathname]);

  return (
    <>
      <Header />
      <div className="main-layout">
        <div className="main-layout-page">
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
}
