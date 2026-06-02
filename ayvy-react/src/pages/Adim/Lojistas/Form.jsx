import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminFormShell from "../../../components/Admin/AdminFormShell";
import ImageUploadField from "../../../components/Admin/ImageUploadField";
import UsuarioQuickModal from "../../../components/Admin/UsuarioQuickModal";
import UsuarioSelector from "../../../components/Admin/UsuarioSelector";
import {
  createLojista,
  getLojista,
  listLojistas,
  listUsuarios,
  updateLojista,
  updateUsuario,
} from "../../../services/adminApi";
import { notifyAdminMetricsChanged } from "../../../utils/adminMetrics";
import "../admin-crud.css";

const STATUS_USUARIO_NOVO = ["ativo"];
const STATUS_USUARIO_EDITAR = ["ativo", "inativo", "bloqueado"];

function normalizarStatusUsuario(valor) {
  const s = String(valor ?? "").toLowerCase();
  return STATUS_USUARIO_EDITAR.includes(s) ? s : "ativo";
}

const EMPTY = {
  usuarioId: "",
  nomeLoja: "",
  slug: "",
  cnpj: "",
  bannerUrl: "",
  logoUrl: "",
  descricao: "",
  usuarioStatus: "ativo",
};

export default function AdminLojistaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [usuariosLojista, setUsuariosLojista] = useState([]);
  const [lojistas, setLojistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, lojistaList] = await Promise.all([listUsuarios(), listLojistas()]);
        if (cancelled) return;
        const lojistasArr = Array.isArray(lojistaList) ? lojistaList : [];
        setLojistas(lojistasArr);
        const semPerfil = (Array.isArray(users) ? users : [])
          .filter((u) => u.papel === "lojista")
          .filter((u) => !lojistasArr.some((l) => l.usuario?.id === u.id));
        setUsuariosLojista(semPerfil);

        if (isEdit) {
          const data = await getLojista(id);
          if (cancelled) return;
          setForm({
            usuarioId: String(data.usuario?.id ?? ""),
            usuarioStatus: normalizarStatusUsuario(data.usuario?.status),
            nomeLoja: data.nomeLoja || "",
            slug: data.slug || "",
            cnpj: data.cnpj || "",
            bannerUrl: data.bannerUrl || "",
            logoUrl: data.logoUrl || "",
            descricao: data.descricao || "",
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function handleUsuarioCriado(usuario) {
    setUsuariosLojista((prev) => [...prev, usuario]);
    setForm((f) => ({ ...f, usuarioId: String(usuario.id) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateLojista(id, {
          nomeLoja: form.nomeLoja.trim(),
          slug: form.slug.trim(),
          cnpj: form.cnpj.replace(/\D/g, ""),
          bannerUrl: form.bannerUrl || null,
          logoUrl: form.logoUrl || null,
          descricao: form.descricao.trim() || null,
        });
        if (form.usuarioId) {
          await updateUsuario(Number(form.usuarioId), { status: form.usuarioStatus });
        }
      } else {
        if (!form.usuarioId) {
          setError("Selecione ou crie o usuário responsável pela loja");
          setSaving(false);
          return;
        }
        await createLojista({
          usuarioId: Number(form.usuarioId),
          nomeLoja: form.nomeLoja.trim(),
          slug: form.slug.trim(),
          cnpj: form.cnpj.replace(/\D/g, ""),
          bannerUrl: form.bannerUrl || null,
          logoUrl: form.logoUrl || null,
          descricao: form.descricao.trim() || null,
        });
      }
      notifyAdminMetricsChanged();
      navigate("/admin/lojistas");
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminFormShell title="Carregando…" backTo="/admin/lojistas">
        <p className="admin-crud-loading">Carregando…</p>
      </AdminFormShell>
    );
  }

  const lojaAtual = isEdit ? lojistas.find((l) => String(l.id) === id) : null;

  return (
    <AdminFormShell
      title={isEdit ? "Editar loja" : "Nova loja"}
      subtitle={
        isEdit
          ? `Responsável: ${lojaAtual?.usuario?.nome ?? "—"}`
          : "Selecione um usuário lojista existente ou crie um novo."
      }
      backTo="/admin/lojistas"
      error={error}
    >
      <form className="admin-crud-form" onSubmit={handleSubmit}>
        {!isEdit ? (
          <UsuarioSelector
            label="Usuário responsável (papel lojista)"
            usuarios={usuariosLojista}
            value={form.usuarioId}
            onChange={(v) => setForm({ ...form, usuarioId: v })}
            onCreateNew={() => setUserModalOpen(true)}
            emptyHint='Clique em "+ Novo usuário" para cadastrar com papel lojista.'
          />
        ) : (
          <div className="admin-crud-field">
            <label>Usuário responsável</label>
            <input
              type="text"
              value={lojaAtual?.usuario?.nome ?? "—"}
              disabled
              readOnly
            />
            <p className="admin-crud-hint">{lojaAtual?.usuario?.email ?? ""}</p>
          </div>
        )}

        <div className="admin-crud-field">
          <label htmlFor="l-nome">Nome da loja</label>
          <input
            id="l-nome"
            value={form.nomeLoja}
            onChange={(e) => setForm({ ...form, nomeLoja: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="l-slug">Slug (URL da vitrine)</label>
          <input
            id="l-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="l-cnpj">CNPJ</label>
          <input
            id="l-cnpj"
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            required
          />
        </div>

        <ImageUploadField
          label="Banner da loja"
          value={form.bannerUrl}
          onChange={(caminho) => setForm({ ...form, bannerUrl: caminho })}
          pasta="lojistas"
        />
        <ImageUploadField
          label="Logo da loja"
          value={form.logoUrl}
          onChange={(caminho) => setForm({ ...form, logoUrl: caminho })}
          pasta="lojistas"
        />

        <div className="admin-crud-field">
          <label htmlFor="l-desc">Descrição</label>
          <textarea
            id="l-desc"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <div className="admin-crud-field">
          <label htmlFor="l-usuario-status">Status do usuário</label>
          <select
            id="l-usuario-status"
            value={isEdit ? form.usuarioStatus : "ativo"}
            disabled={!isEdit}
            onChange={(e) => setForm({ ...form, usuarioStatus: e.target.value })}
          >
            {(isEdit ? STATUS_USUARIO_EDITAR : STATUS_USUARIO_NOVO).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-footer">
          <Link to="/admin/lojistas" className="admin-btn admin-btn--ghost">
            Cancelar
          </Link>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>

      <UsuarioQuickModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onCreated={handleUsuarioCriado}
        papel="lojista"
        title="Novo usuário lojista"
      />
    </AdminFormShell>
  );
}
