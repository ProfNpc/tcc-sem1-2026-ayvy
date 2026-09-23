import "./style.css";

export default function BrandSlider({ title, brands }) {
  const list = Array.isArray(brands) && brands.length ? brands : [];
  if (list.length === 0) {
    return (
      <section className="brand-slider-section">
        <h2 className="slider-title-center">{title}</h2>
      </section>
    );
  }

  // Duas cópias iguais → anima -50% e volta (ida e volta contínua)
  const track = [...list, ...list, ...list, ...list];

  return (
    <section className="brand-slider-section">
      <h2 className="slider-title-center">{title}</h2>
      <div className="brand-container">
        <div className="brand-track">
          {track.map((name, i) => (
            <div className="brand-item" key={`${name}-${i}`}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
