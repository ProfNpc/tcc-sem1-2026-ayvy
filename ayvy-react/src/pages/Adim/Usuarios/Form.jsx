/**
 * Form.jsx — Usuários
 * Rotas: /admin/usuarios/novo (criar) | /admin/usuarios/:id/editar (editar)
 *
 * APIs deste arquivo:
 *   Abrir edição     → GET /usuarios/:id
 *   Botão Salvar novo → POST /usuarios
 *   Botão Salvar editar → PUT /usuarios/:id
 *   Avatar (upload)  → POST /upload (pasta usuarios)
 *
 * Excluir e link Editar ficam em index.jsx (DELETE /usuarios/:id e rota editar).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminFormShell from "../../../components/Admin/AdminFormShell";
import ImageUploadField from "../../../components/Admin/ImageUploadField";
import { createUsuario, getUsuario, updateUsuario } from "../../../services/adminApi";
import "../admin-crud.css";

const PAPEIS = ["admin", "cliente", "lojista"];
const STATUS_NOVO = ["ativo"];
const STATUS_EDITAR = ["ativo", "inativo", "bloqueado"];

function normalizarStatus(valor) {
  const s = String(valor ?? "").toLowerCase();
  return STATUS_EDITAR.includes(s) ? s : "ativo";
}

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
        // GET /usuarios/:id — traz dados reais (ex.: status bloqueado da Letícia)
        const data = await getUsuario(id);
        if (cancelled) return;
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          senha: "",
          telefone: data.telefone || "",
          avatarUrl: data.avatarUrl || "",
          papel: data.papel || "cliente",
          // Converte status da API para valor válido no select
          status: normalizarStatus(data.status),
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

  // Disparado pelo botão "Salvar" (type="submit")
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
        // Criar: força ativo | Editar: usa o que está no select
        status: isEdit ? form.status : "ativo",
      };
      if (form.senha.trim()) payload.senha = form.senha.trim();

      if (isEdit) {
        // Edição sem senha nova: não envia campo senha (back mantém a atual)
        if (!form.senha.trim()) delete payload.senha;
        // PUT /usuarios/:id — salva nome, email, status, etc.
        await updateUsuario(id, payload);
      } else {
        if (!form.senha.trim()) {
          setError("Senha é obrigatória");
          setSaving(false);
          return;
        }
        payload.senha = form.senha.trim();
        // POST /usuarios — cadastra usuário novo (status já vem "ativo" no payload)
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
      {/* onSubmit → handleSubmit → POST ou PUT /usuarios */}
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
            value={isEdit ? form.status : "ativo"}
            // Novo usuário: não pode mudar status (sempre ativo)
            disabled={!isEdit}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {/* Criar = 1 opção | Editar = ativo, inativo, bloqueado */}
            {(isEdit ? STATUS_EDITAR : STATUS_NOVO).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <ImageUploadField
          label="Avatar"
          value={form.avatarUrl}
          // POST /upload pasta=usuarios — salva caminho em form.avatarUrl
          onChange={(caminho) => setForm({ ...form, avatarUrl: caminho })}
          pasta="usuarios"
        />

        <div className="admin-form-footer">
          {/* Cancelar: só volta para a lista, não chama API */}
          <Link to="/admin/usuarios" className="admin-btn admin-btn--ghost">
            Cancelar
          </Link>
          {/* Salvar: novo → POST /usuarios | editar → PUT /usuarios/:id */}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </AdminFormShell>
  );
}
