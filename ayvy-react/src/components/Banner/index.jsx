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
