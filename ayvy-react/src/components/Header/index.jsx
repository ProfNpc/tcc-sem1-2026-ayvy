/**
 * Cabeçalho do site: só embrulha a Navbar (ponto único para evoluir o topo).
 */
import Navbar from "../Navbar";
import "./style.css";

/** Cabeçalho do app: ponto único para evoluir (banners globais, idioma, etc.). */
export default function Header() {
  return (
    <div className="ayvy-header-root">
      <Navbar />
    </div>
  );
}
