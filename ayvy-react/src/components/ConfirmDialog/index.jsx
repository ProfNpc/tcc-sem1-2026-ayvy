import { useEffect } from "react";
import "./style.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Sim",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onCancel?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="cdlg-overlay" onClick={() => !busy && onCancel?.()}>
      <div
        className="cdlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cdlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cdlg-title">{title}</h2>
        {message ? <p>{message}</p> : null}
        <div className="cdlg-actions">
          <button type="button" className="cdlg-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cdlg-btn cdlg-btn--primary${danger ? " cdlg-btn--danger" : ""}`}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
