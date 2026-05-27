import "./style.css";

export default function LogoutModal({ open, onClose, onConfirm }) {
  return (
    <>
      <div
        className={`logout-overlay ${open ? "active" : ""}`}
        id="logoutOverlay"
        onClick={onClose}
        role="presentation"
      />
      <div className={`logout-modal ${open ? "active" : ""}`} id="logoutModal">
        <p>Tem certeza que deseja sair?</p>
        <div className="logout-actions">
          <button type="button" className="btn-round btn-logout confirm" onClick={onConfirm}>
            Sim, certeza
          </button>
          <button type="button" className="btn-round" onClick={onClose}>
            Não
          </button>
        </div>
      </div>
    </>
  );
}
