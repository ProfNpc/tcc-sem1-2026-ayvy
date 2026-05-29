import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminFormShell from "../../../components/Admin/AdminFormShell";
import UsuarioQuickModal from "../../../components/Admin/UsuarioQuickModal";
import UsuarioSelector from "../../../components/Admin/UsuarioSelector";
import {
  createCliente,
  getCliente,
  listClientes,
  listUsuarios,
  updateCliente,
} from "../../../services/adminApi";
import { notifyAdminMetricsChanged } from "../../../utils/adminMetrics";
import "../admin-crud.css";

const EMPTY = {
  usuarioId: "",
  cpf: "",
  dataNascimento: "",
};

export default function AdminClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [usuariosCliente, setUsuariosCliente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, clientes] = await Promise.all([listUsuarios(), listClientes()]);
        if (cancelled) return;
        const clientesArr = Array.isArray(clientes) ? clientes : [];
        const semPerfil = (Array.isArray(users) ? users : [])
          .filter((u) => u.papel === "cliente")
          .filter((u) => !clientesArr.some((c) => c.usuario?.id === u.id));
        setUsuariosCliente(semPerfil);

        if (isEdit) {
          const data = await getCliente(id);
          if (cancelled) return;
          setForm({
            usuarioId: String(data.usuario?.id ?? ""),
            cpf: data.cpf || "",
            dataNascimento: data.dataNascimento ? String(data.dataNascimento).slice(0, 10) : "",
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function handleUsuarioCriado(usuario) {
    setUsuariosCliente((prev) => [...prev, usuario]);
    setForm((f) => ({ ...f, usuarioId: String(usuario.id) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateCliente(id, {
          cpf: form.cpf.replace(/\D/g, ""),
          dataNascimento: form.dataNascimento || null,
        });
      } else {
        if (!form.usuarioId) {
          setError("Selecione ou crie o usuário cliente");
          setSaving(false);
          return;
        }
        await createCliente({
          usuarioId: Number(form.usuarioId),
          cpf: form.cpf.replace(/\D/g, ""),
          dataNascimento: form.dataNascimento || null,
        });
      }
      notifyAdminMetricsChanged();
      navigate("/admin/clientes");
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminFormShell title="Carregando…" backTo="/admin/clientes">
        <p className="admin-crud-loading">Carregando…</p>
      </AdminFormShell>
    );
  }

  return (
    <AdminFormShell
      title={isEdit ? "Editar cliente" : "Novo cliente"}
      subtitle={
        isEdit
          ? "Atualize CPF e data de nascimento."
          : "Selecione usuário cliente ou crie um novo (papel cliente automático)."
      }
      backTo="/admin/clientes"
      error={error}
    >
      <form className="admin-crud-form" onSubmit={handleSubmit}>
        {!isEdit ? (
          <UsuarioSelector
            label="Usuário (papel cliente)"
            usuarios={usuariosCliente}
            value={form.usuarioId}
            onChange={(v) => setForm({ ...form, usuarioId: v })}
            onCreateNew={() => setUserModalOpen(true)}
            emptyHint='Use "+ Novo usuário" para cadastrar com papel cliente.'
          />
        ) : null}

        <div className="admin-crud-field">
          <label htmlFor="c-cpf">CPF (11 dígitos)</label>
          <input
            id="c-cpf"
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            required
            maxLength={11}
          />
        </div>
        <div className="admin-crud-field">
          <label htmlFor="c-nasc">Data de nascimento</label>
          <input
            id="c-nasc"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
          />
        </div>

        <div className="admin-form-footer">
          <Link to="/admin/clientes" className="admin-btn admin-btn--ghost">
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
        papel="cliente"
        title="Novo usuário cliente"
      />
    </AdminFormShell>
  );
}
