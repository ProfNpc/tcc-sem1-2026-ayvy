import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Footer from "../../../components/Footer";
import { useAuth } from "../../../context/AuthContext";
import { isShopOwner } from "../../../utils/mockAuthUsers";
import { normalizeSlugParam } from "../../../utils/lojistaData";
import {
  listCategorias,
  salvarProdutoLojista,
} from "../../../services/lojistaApi";
import "./style.css";

const TAMANHOS_PADRAO = ["PP", "P", "M", "G", "GG", "Único"];

const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  price: "",
  discountPercent: "",
  stock: "",
  sku: "",
  colors: [],
  sizes: [],
};

export default function LojaProdutoNovo() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const { user } = useAuth();
  const navigate = useNavigate();
  const lojaPath = `/loja/${slug}`;

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listCategorias()
      .then((list) => {
        if (!cancelled) setCategorias(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setCategorias([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isShopOwner(user, slug)) {
    return <Navigate to={lojaPath} replace />;
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePriceChange(raw) {
    const cleaned = String(raw).replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    if (parts.length <= 1) {
      updateField("price", parts[0] ?? "");
      return;
    }
    updateField("price", `${parts[0]},${parts[1].slice(0, 2)}`);
  }

  async function persist(status, successMsg, redirectAba) {
    if (!user?.lojistaId) {
      alert("Sessão de lojista incompleta. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      await salvarProdutoLojista({
        lojistaId: user.lojistaId,
        form,
        images,
        status,
        categoriaId: form.categoryId || null,
      });
      alert(successMsg);
      navigate(`${lojaPath}?aba=${redirectAba}`, { replace: true });
    } catch (err) {
      alert(err.message || "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDraftSave() {
    if (!form.title.trim() && images.length === 0) {
      alert("Preencha ao menos o nome ou uma foto para salvar o rascunho.");
      return;
    }
    const formDraft = {
      ...form,
      price: form.price.trim() || "0,00",
      title: form.title.trim() || "Rascunho sem nome",
    };
    if (!user?.lojistaId) {
      alert("Sessão de lojista incompleta. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      await salvarProdutoLojista({
        lojistaId: user.lojistaId,
        form: formDraft,
        images,
        status: "rascunho",
        categoriaId: form.categoryId || null,
      });
      alert("Rascunho salvo na API! Você encontra em Minha loja → Rascunhos.");
      navigate(`${lojaPath}?aba=rascunhos`, { replace: true });
    } catch (err) {
      alert(err.message || "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  function toggleChip(listName, value) {
    setForm((prev) => {
      const list = prev[listName];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...prev, [listName]: next };
    });
  }

  function addColor() {
    const name = colorInput.trim();
    if (!name) return;
    const exists = form.colors.some((c) => c.toLowerCase() === name.toLowerCase());
    if (!exists) {
      setForm((prev) => ({ ...prev, colors: [...prev.colors, name] }));
    }
    setColorInput("");
  }

  function removeColor(cor) {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== cor),
    }));
  }

  function handleColorKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addColor();
    }
  }

  function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    const next = files.slice(0, 6).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [...prev, ...next].slice(0, 6);
    });
    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Informe o nome do produto.");
      return;
    }
    if (!form.price.trim()) {
      alert("Informe o preço.");
      return;
    }
    if (images.length === 0) {
      alert("Adicione pelo menos uma foto.");
      return;
    }
    await persist(
      "ativo",
      "Produto publicado na API! Ele aparece em Meus produtos.",
      "produtos",
    );
  }

  return (
    <div className="produto-novo-page">
      <div className="produto-novo-wrap">
        <header className="produto-novo-header">
          <div>
            <Link to={lojaPath} className="produto-novo-back">
              <i className="fas fa-arrow-left" aria-hidden /> Minha loja
            </Link>
            <h1>Cadastrar produto</h1>
            <p className="produto-novo-sub">
              Os dados são salvos na API (rascunho ou publicação).
            </p>
          </div>
        </header>

        <form id="form-produto-novo" className="produto-novo-form" onSubmit={handleSubmit}>
          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-images" aria-hidden /> Fotos do produto
            </h2>
            <p className="produto-novo-hint">Até 6 imagens. A primeira será a capa na vitrine.</p>

            <div className="produto-novo-gallery">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className={`produto-novo-thumb${index === 0 ? " is-cover" : ""}`}
                >
                  <img src={img.preview} alt="" />
                  {index === 0 ? <span className="produto-novo-cover-tag">Capa</span> : null}
                  <button
                    type="button"
                    className="produto-novo-thumb-remove"
                    aria-label="Remover foto"
                    onClick={() => removeImage(img.id)}
                  >
                    <i className="fas fa-times" aria-hidden />
                  </button>
                </div>
              ))}

              {images.length < 6 ? (
                <label className="produto-novo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                  />
                  <i className="fas fa-plus" aria-hidden />
                  <span>Adicionar foto</span>
                </label>
              ) : null}
            </div>
          </section>

          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-tag" aria-hidden /> Informações básicas
            </h2>

            <label className="produto-novo-field">
              <span>Nome do produto *</span>
              <input
                type="text"
                placeholder="Ex.: Vestido linho verão"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={120}
              />
            </label>

            <label className="produto-novo-field">
              <span>Descrição</span>
              <textarea
                rows={4}
                placeholder="Detalhes, material, cuidados, medidas…"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                maxLength={2000}
              />
            </label>

            <label className="produto-novo-field">
              <span>Categoria</span>
              <select
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
              >
                <option value="">Selecione</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-dollar-sign" aria-hidden /> Preço e estoque
            </h2>

            <div className="produto-novo-row">
              <label className="produto-novo-field">
                <span>Preço (R$) *</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                  }}
                />
              </label>
              <label className="produto-novo-field">
                <span>Desconto (%) — só vitrine</span>
                <input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="0"
                  value={form.discountPercent}
                  onChange={(e) => updateField("discountPercent", e.target.value)}
                />
              </label>
            </div>

            <div className="produto-novo-row">
              <label className="produto-novo-field">
                <span>Estoque (unidades)</span>
                <input
                  type="number"
                  min={0}
                  placeholder="10"
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                />
              </label>
              <label className="produto-novo-field">
                <span>SKU / código — só vitrine</span>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-palette" aria-hidden /> Variações
            </h2>
            <p className="produto-novo-hint">
              Cores e tamanhos ficam só no front por enquanto (sem coluna no banco).
            </p>

            <div className="produto-novo-chips-group">
              <span className="produto-novo-chips-label">Cores</span>
              {form.colors.length > 0 ? (
                <div className="produto-novo-chips produto-novo-chips--tags">
                  {form.colors.map((cor) => (
                    <span key={cor} className="produto-novo-chip produto-novo-chip--tag is-on">
                      {cor}
                      <button
                        type="button"
                        className="produto-novo-chip-remove"
                        aria-label={`Remover cor ${cor}`}
                        onClick={() => removeColor(cor)}
                      >
                        <i className="fas fa-times" aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="produto-novo-color-add">
                <input
                  type="text"
                  className="produto-novo-color-input"
                  placeholder="Ex.: Verde musgo…"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={handleColorKeyDown}
                  maxLength={40}
                />
              </div>
            </div>

            <div className="produto-novo-chips-group">
              <span className="produto-novo-chips-label">Tamanhos</span>
              <div className="produto-novo-chips">
                {TAMANHOS_PADRAO.map((tam) => (
                  <button
                    key={tam}
                    type="button"
                    className={`produto-novo-chip${form.sizes.includes(tam) ? " is-on" : ""}`}
                    onClick={() => toggleChip("sizes", tam)}
                  >
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <footer className="produto-novo-footer">
            <button
              type="button"
              className="produto-novo-btn produto-novo-btn--ghost"
              onClick={handleDraftSave}
              disabled={saving}
            >
              Salvar rascunho
            </button>
            <Link to={lojaPath} className="produto-novo-btn produto-novo-btn--ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="produto-novo-btn produto-novo-btn--primary"
              disabled={saving}
            >
              {saving ? "Publicando…" : "Publicar produto"}
            </button>
          </footer>
        </form>
      </div>

      <Footer />
    </div>
  );
}
