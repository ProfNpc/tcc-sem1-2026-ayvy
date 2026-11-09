/**
 * Banner grande do topo da home (imagem AYVY) com a busca por cima (children).
 */
import "./style.css";

/** Banner principal da home (hero + área de conteúdo sobreposto). */
export default function Banner({ imageSrc, imageAlt, children }) {
  return (
    <section className="banner-total">
      <img src={imageSrc} alt={imageAlt} className="img-ponta-a-ponta" />
      {children}
    </section>
  );
}
