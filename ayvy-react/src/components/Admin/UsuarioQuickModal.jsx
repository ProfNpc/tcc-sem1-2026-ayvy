/**
 * Modal usado em Clientes/Form e Lojistas/Form (+ Novo usuário).
 * Botão "Criar e selecionar" → POST /usuarios (papel lojista ou cliente, status ativo).
 */
import { useState } from "react";
import { createUsuario } from "../../services/adminApi";
import ImageUploadField from "./ImageUploadField";

const EMPTY = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  avatarUrl: "",
  status: "ativo",
};

/**
 * Modal para criar usuário com papel fixo (lojista ou cliente).
 * @param {{ open: boolean, onClose: () => void, onCreated: (usuario: object) => void, papel: 'lojista'|'cliente', title: string }} props
 */
export default function UsuarioQuickModal({ open, onClose, onCreated, papel, title }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function handleClose() {
    setForm(EMPTY);
    setError("");
    onClose();
  }

  // Botão "Criar e selecionar"
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.senha.trim()) {
      setError("Senha é obrigatória");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // POST /usuarios — cria usuario lojista/cliente; status sempre ativo
      const created = await createUsuario({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha.trim(),
        telefone: form.telefone.trim() || null,
        avatarUrl: form.avatarUrl || null,
        papel,
        status: "ativo",
      });
      setForm(EMPTY);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-crud-overlay" role="dialog" aria-modal="true">
      {/* submit → handleSubmit → POST /usuarios */}
      <form className="admin-crud-modal admin-crud-form" onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <p className="admin-crud-hint">
          Papel definido automaticamente: <strong>{papel}</strong>
        </p>

        {error ? <div className="admin-crud-alert admin-crud-alert--error">{error}</div> : null}

        <div className="admin-crud-field">
          <label htmlFor="qm-nome">Nome</label>
          <input
            id="qm-nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="qm-email">E-mail</label>
          <input
            id="qm-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="qm-senha">Senha</label>
          <input
            id="qm-senha"
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="qm-tel">Telefone</label>
          <input
            id="qm-tel"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <ImageUploadField
          label="Avatar"
          value={form.avatarUrl}
          // POST /upload (pasta usuarios)
          onChange={(caminho) => setForm({ ...form, avatarUrl: caminho })}
          pasta="usuarios"
        />

        <div className="admin-crud-modal-actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handleClose}>
            Cancelar
          </button>
          {/* Criar usuário: POST /usuarios — depois onCreated preenche o select do form pai */}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Criando…" : "Criar e selecionar"}
          </button>
        </div>
      </form>
    </div>
  );
}
