import { useState } from "react";
import { addProdutoImagem, deleteProdutoImagem, uploadImage } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/imageUrl";

/**
 * Galeria de imagens do produto (upload + lista).
 * @param {{ produtoId?: number, imagens: Array<{ id?: number, caminho: string, ordem?: number }>, onChange: (imgs: Array) => void }} props
 */
export default function ProdutoGaleriaField({ produtoId, imagens, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadImage(file, "produtos");
      const ordem = imagens.length;
      if (produtoId) {
        const saved = await addProdutoImagem(produtoId, { caminho: res.caminho, ordem });
        onChange([...imagens, saved]);
      } else {
        onChange([...imagens, { caminho: res.caminho, ordem }]);
      }
    } catch (e) {
      setError(e.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(img) {
    if (img.id && produtoId) {
      try {
        await deleteProdutoImagem(produtoId, img.id);
      } catch (e) {
        setError(e.message || "Erro ao remover imagem");
        return;
      }
    }
    onChange(imagens.filter((i) => i !== img));
  }

  return (
    <div className="admin-crud-field">
      <label>Galeria de imagens</label>
      <p className="admin-crud-hint">Imagens extras além da principal. Ordem = sequência na vitrine.</p>

      {imagens.length > 0 ? (
        <ul className="admin-galeria-grid">
          {imagens.map((img) => (
            <li key={img.id ?? img.caminho} className="admin-galeria-item">
              <img src={resolveImageUrl(img.caminho)} alt="" />
              <button
                type="button"
                className="admin-galeria-remove"
                onClick={() => handleRemove(img)}
                aria-label="Remover imagem"
              >
                <i className="fas fa-times" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="admin-upload-label-btn" style={{ marginTop: "0.5rem" }}>
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
        {uploading ? "Enviando…" : "+ Adicionar à galeria"}
      </label>
      {error ? <p className="admin-crud-hint" style={{ color: "#b42318" }}>{error}</p> : null}
    </div>
  );
}
