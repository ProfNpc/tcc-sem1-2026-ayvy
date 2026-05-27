import "./style.css";

export default function TeamMemberRow({ reversed, imageSrc, imageAlt, name, children }) {
  return (
    <div className={`membro-row ${reversed ? "reverso" : ""}`}>
      <div
        className="membro-media membro-media-touch"
        onTouchStart={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <img src={imageSrc} alt={imageAlt} />
      </div>
      <div className="membro-info">
        <h3>{name}</h3>
        {children}
      </div>
    </div>
  );
}
