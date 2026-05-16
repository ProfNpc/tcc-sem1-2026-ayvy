import "./style.css";

export default function BrandSlider({ title, brands }) {
  return (
    <section className="brand-slider-section">
      <h2 className="slider-title-center">{title}</h2>
      <div className="brand-container">
        <div className="brand-track">
          {brands.map((name) => (
            <div className="brand-item" key={name}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
