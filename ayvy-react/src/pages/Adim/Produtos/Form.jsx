import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminFormShell from "../../../components/Admin/AdminFormShell";
import ImageUploadField from "../../../components/Admin/ImageUploadField";
import ProdutoGaleriaField from "../../../components/Admin/ProdutoGaleriaField";
import {
  addProdutoImagem,
  createProduto,
  getProduto,
  listCategorias,
  listLojistas,
  listProdutoImagens,
  updateProduto,
} from "../../../services/adminApi";
import { notifyAdminMetricsChanged } from "../../../utils/adminMetrics";
import "../admin-crud.css";

const STATUS_PRODUTO = [
  { value: "rascunho", label: "Rascunho" },
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "esgotado", label: "Esgotado" },
];

const EMPTY = {
  lojistaId: "",
  categoriaId: "",
  nome: "",
  slug: "",
  descricao: "",
  preco: "",
  estoque: "0",
  imagemPrincipalUrl: "",
  status: "ativo",
};

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPayload(form, isEdit) {
  const payload = {
    nome: form.nome.trim(),
    slug: form.slug.trim(),
    descricao: form.descricao.trim() || null,
    preco: Number(form.preco),
    estoque: Number(form.estoque) || 0,
    imagemPrincipalUrl: form.imagemPrincipalUrl || null,
    status: form.status,
  };
  if (!isEdit) {
    payload.lojista = { id: Number(form.lojistaId) };
  }
  if (form.categoriaId) {
    payload.categoria = { id: Number(form.categoriaId) };
  } else {
    payload.categoria = null;
  }
  return payload;
}

export default function AdminProdutoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [galeria, setGaleria] = useState([]);
  const [lojistas, setLojistas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [lojaNome, setLojaNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lojistaList, catList] = await Promise.all([listLojistas(), listCategorias()]);
        if (cancelled) return;
        setLojistas(Array.isArray(lojistaList) ? lojistaList : []);
        setCategorias(Array.isArray(catList) ? catList : []);

        if (isEdit) {
          const [data, imgs] = await Promise.all([getProduto(id), listProdutoImagens(id)]);
          if (cancelled) return;
          setForm({
            lojistaId: String(data.lojista?.id ?? ""),
            categoriaId: data.categoria?.id ? String(data.categoria.id) : "",
            nome: data.nome || "",
            slug: data.slug || "",
            descricao: data.descricao || "",
            preco: data.preco != null ? String(data.preco) : "",
            estoque: data.estoque != null ? String(data.estoque) : "0",
            imagemPrincipalUrl: data.imagemPrincipalUrl || "",
            status: data.status || "ativo",
          });
          setLojaNome(data.lojista?.nomeLoja ?? "");
          setGaleria(Array.isArray(imgs) ? imgs : []);
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

  function handleNomeBlur() {
    if (!form.slug.trim() && form.nome.trim()) {
      setForm((f) => ({ ...f, slug: slugify(f.nome) }));
    }
  }

  async function syncGaleriaPendentes(produtoId) {
    const pendentes = galeria.filter((img) => !img.id);
    for (const img of pendentes) {
      await addProdutoImagem(produtoId, {
        caminho: img.caminho,
        ordem: img.ordem ?? 0,
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!isEdit && !form.lojistaId) {
        setError("Selecione a loja do produto");
        setSaving(false);
        return;
      }
      if (!form.preco || Number(form.preco) < 0) {
        setError("Informe um preço válido");
        setSaving(false);
        return;
      }

      const payload = buildPayload(form, isEdit);

      if (isEdit) {
        await updateProduto(id, payload);
        await syncGaleriaPendentes(Number(id));
      } else {
        const created = await createProduto(payload);
        await syncGaleriaPendentes(created.id);
      }
      notifyAdminMetricsChanged();
      navigate("/admin/produtos");
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminFormShell title="Carregando…" backTo="/admin/produtos">
        <p className="admin-crud-loading">Carregando…</p>
      </AdminFormShell>
    );
  }

  return (
    <AdminFormShell
      title={isEdit ? "Editar" : "Novo produto"}
      subtitle={
        isEdit
          ? `Loja: ${lojaNome || "—"}`
          : "Vincule o produto a uma loja aprovada na plataforma."
      }
      backTo="/admin/produtos"
      error={error}
    >
      <form className="admin-crud-form admin-form-page--wide" onSubmit={handleSubmit}>
        {!isEdit ? (
          <div className="admin-crud-field">
            <label htmlFor="p-loja">Loja</label>
            <select
              id="p-loja"
              value={form.lojistaId}
              onChange={(e) => setForm({ ...form, lojistaId: e.target.value })}
              required
            >
              <option value="">Selecione a loja…</option>
              {lojistas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nomeLoja} (@{l.slug})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="admin-crud-field">
            <label>Loja</label>
            <input type="text" value={lojaNome} disabled readOnly />
          </div>
        )}

        <div className="admin-crud-field">
          <label htmlFor="p-cat">Categoria</label>
          <select
            id="p-cat"
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-crud-field">
          <label htmlFor="p-nome">Nome</label>
          <input
            id="p-nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            onBlur={handleNomeBlur}
            required
          />
        </div>

        <div className="admin-crud-field">
          <label htmlFor="p-slug">Slug</label>
          <input
            id="p-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
          <p className="admin-crud-hint">URL na vitrine: /loja/…/p/{form.slug || "…"}</p>
        </div>

        <div className="admin-crud-field-row">
          <div className="admin-crud-field">
            <label htmlFor="p-preco">Preço (R$)</label>
            <input
              id="p-preco"
              type="number"
              min="0"
              step="0.01"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              required
            />
          </div>
          <div className="admin-crud-field">
            <label htmlFor="p-estoque">Estoque</label>
            <input
              id="p-estoque"
              type="number"
              min="0"
              step="1"
              value={form.estoque}
              onChange={(e) => setForm({ ...form, estoque: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="admin-crud-field">
          <label htmlFor="p-desc">Descrição</label>
          <textarea
            id="p-desc"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <ImageUploadField
          label="Imagem principal"
          value={form.imagemPrincipalUrl}
          onChange={(caminho) => setForm({ ...form, imagemPrincipalUrl: caminho })}
          pasta="produtos"
        />

        <ProdutoGaleriaField
          produtoId={isEdit ? Number(id) : undefined}
          imagens={galeria}
          onChange={setGaleria}
        />

        <div className="admin-crud-field">
          <label htmlFor="p-status">Status</label>
          <select
            id="p-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_PRODUTO.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-footer">
          <Link to="/admin/produtos" className="admin-btn admin-btn--ghost">
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
