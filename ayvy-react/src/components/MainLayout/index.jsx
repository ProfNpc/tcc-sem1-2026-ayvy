import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Header";
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
      <Outlet />
    </>
  );
}
