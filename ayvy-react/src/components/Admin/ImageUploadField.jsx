import { useState } from "react";
import { uploadImage } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/imageUrl";

/**
 * @param {{ label: string, value: string, onChange: (caminho: string) => void, pasta: string, required?: boolean }} props
 */
export default function ImageUploadField({ label, value, onChange, pasta, required = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadImage(file, pasta);
      onChange(res.caminho);
    } catch (e) {
      setError(e.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-crud-field">
      <label>
        {label}
        {required ? " *" : ""}
      </label>
      <div className="admin-upload-box">
        {value ? (
          <img src={resolveImageUrl(value)} alt="" className="admin-crud-img-preview admin-upload-preview" />
        ) : (
          <div className="admin-upload-placeholder">
            <i className="fas fa-image" aria-hidden />
            <span>Nenhuma imagem</span>
          </div>
        )}
        <div className="admin-upload-actions">
          <label className="admin-upload-label-btn">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="admin-upload-input-hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {uploading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
          </label>
          {value ? (
            <button type="button" className="admin-crud-btn-sm" onClick={() => onChange("")}>
              Remover
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="admin-crud-hint" style={{ color: "#b42318" }}>{error}</p> : null}
    </div>
  );
}
