import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminFormShell from "../../../components/Admin/AdminFormShell";
import ImageUploadField from "../../../components/Admin/ImageUploadField";
import { createUsuario, getUsuario, updateUsuario } from "../../../services/adminApi";
import "../admin-crud.css";

const PAPEIS = ["admin", "cliente", "lojista"];
const STATUS_LIST = ["ativo"];
const STATUS_LIST_INATIVO = ["inativo"];
const STATUS_LIST_BLOQUEADO = ["bloqueado"];

const EMPTY = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  avatarUrl: "",
  papel: "cliente",
  status: "ativo",
};

export default function AdminUsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getUsuario(id);
        if (cancelled) return;
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          senha: "",
          telefone: data.telefone || "",
          avatarUrl: data.avatarUrl || "",
          papel: data.papel || "cliente",
          status: data.status || "ativo",
        });
      } catch (e) {
        if (!cancelled) setError(e.message || "Usuário não encontrado");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        avatarUrl: form.avatarUrl || null,
        papel: form.papel,
        status: form.status,
      };
      if (form.senha.trim()) payload.senha = form.senha.trim();

      if (isEdit) {
        if (!form.senha.trim()) delete payload.senha;
        await updateUsuario(id, payload);
      } else {
        if (!form.senha.trim()) {
          setError("Senha é obrigatória");
          setSaving(false);
          return;
        }
        payload.senha = form.senha.trim();
        await createUsuario(payload);
      }
      navigate("/admin/usuarios");
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminFormShell title="Carregando…" backTo="/admin/usuarios">
        <p className="admin-crud-loading">Carregando usuário…</p>
      </AdminFormShell>
    );
  }

  return (
    <AdminFormShell
      title={isEdit ? "Editar usuário" : "Novo usuário"}
      subtitle="Identidade da plataforma. Perfil de cliente ou lojista é vinculado depois."
      backTo="/admin/usuarios"
      error={error}
    >
      <form className="admin-crud-form" onSubmit={handleSubmit}>
        <div className="admin-crud-field">
          <label htmlFor="u-nome">Nome</label>
          <input
            id="u-nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="u-email">E-mail</label>
          <input
            id="u-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="u-senha">Senha {isEdit ? "(deixe vazio para manter)" : ""}</label>
          <input
            id="u-senha"
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="u-tel">Telefone</label>
          <input
            id="u-tel"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="u-papel">Papel</label>
          <select
            id="u-papel"
            value={form.papel}
            onChange={(e) => setForm({ ...form, papel: e.target.value })}
          >
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-crud-field">
          <label htmlFor="u-status">Status</label>
          <select
            id="u-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <ImageUploadField
          label="Avatar"
          value={form.avatarUrl}
          onChange={(caminho) => setForm({ ...form, avatarUrl: caminho })}
          pasta="usuarios"
        />

        <div className="admin-form-footer">
          <Link to="/admin/usuarios" className="admin-btn admin-btn--ghost">
            Cancelar
          </Link>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </AdminFormShell>
  );
}
