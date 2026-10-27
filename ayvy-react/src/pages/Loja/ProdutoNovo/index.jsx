import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import CategoriaPicker, { categoriaCompleta } from "./CategoriaPicker";
import { isShopOwner } from "../../../utils/mockAuthUsers";
import { normalizeSlugParam } from "../../../utils/lojistaData";
import {
  atualizarProdutoLojista,
  carregarProdutoParaEdicao,
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
  const { slug: raw, productId } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const isEdit = Boolean(productId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const lojaPath = `/loja/${slug}`;

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [editStatus, setEditStatus] = useState("");

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

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingEdit(true);
      setLoadError("");
      try {
        const data = await carregarProdutoParaEdicao(productId);
        if (cancelled) return;
        const donoId = data.produto?.lojista?.id;
        if (user?.lojistaId && donoId != null && Number(donoId) !== Number(user.lojistaId)) {
          setLoadError("Este produto não pertence à sua loja.");
          return;
        }
        setForm(data.form);
        setImages(data.images);
        setOriginalImages(data.images);
        setEditStatus(String(data.produto?.status || "").toLowerCase());
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Não foi possível carregar o produto.");
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId, user?.lojistaId]);

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

  function toggleSize(value) {
    setForm((prev) => {
      const next = prev.sizes.includes(value)
        ? prev.sizes.filter((v) => v !== value)
        : [...prev.sizes, value];
      return { ...prev, sizes: next };
    });
  }

  function addSize() {
    const name = sizeInput.trim();
    if (!name) return;
    const exists = form.sizes.some((s) => s.toLowerCase() === name.toLowerCase());
    if (!exists) {
      setForm((prev) => ({ ...prev, sizes: [...prev.sizes, name] }));
    }
    setSizeInput("");
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

  function onEnter(fn) {
    return (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fn();
      }
    };
  }

  function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    const next = files.slice(0, 6).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...next].slice(0, 6));
    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.file) URL.revokeObjectURL(item.preview);
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
    if (!categoriaCompleta(categorias, form.categoryId)) {
      alert("Escolha a categoria principal e a subcategoria do produto.");
      return;
    }
    if (!isEdit) {
      await persist(
        "ativo",
        "Produto publicado na API! Ele aparece em Meus produtos.",
        "produtos",
      );
      return;
    }
    setSaving(true);
    try {
      await atualizarProdutoLojista({
        produtoId: productId,
        form,
        images,
        originalImages,
        categoriaId: form.categoryId || null,
      });
      const publico = !editStatus || editStatus === "ativo";
      navigate(publico ? `${lojaPath}/p/${productId}` : lojaPath, { replace: true });
    } catch (err) {
      alert(err.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  const sizeOptions = [
    ...TAMANHOS_PADRAO,
    ...form.sizes.filter((s) => !TAMANHOS_PADRAO.includes(s)),
  ];

  if (isEdit && (loadingEdit || loadError)) {
    return (
      <div className="produto-novo-page">
        <div className="produto-novo-wrap">
          <Link to={lojaPath} className="produto-novo-back">
            <i className="fas fa-arrow-left" aria-hidden /> Minha loja
          </Link>
          <p className="produto-novo-sub" style={{ marginTop: "1rem" }}>
            {loadError || "Carregando produto…"}
          </p>
        </div>
      </div>
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
            <h1>{isEdit ? "Editar produto" : "Cadastrar produto"}</h1>
            <p className="produto-novo-sub">
              {isEdit
                ? "Altere fotos, preço, cores e tamanhos. As mudanças são salvas na API."
                : "Os dados são salvos na API (rascunho ou publicação)."}
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

          </section>

          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-th-large" aria-hidden /> Categoria
            </h2>
            <p className="produto-novo-hint">
              Escolha onde o produto aparece em Categorias. Ex.: Jaqueta de couro feminina → Moda
              Feminina › Casacos e jaquetas femininas.
            </p>
            <CategoriaPicker
              categorias={categorias}
              value={form.categoryId}
              onChange={(id) => updateField("categoryId", id)}
            />
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
              Clique no X para tirar uma cor e no tamanho para ligar ou desligar.
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
                  placeholder="Nova cor (Enter para adicionar)"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={onEnter(addColor)}
                  maxLength={40}
                />
                <button
                  type="button"
                  className="produto-novo-chip"
                  onClick={addColor}
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="produto-novo-chips-group">
              <span className="produto-novo-chips-label">Tamanhos</span>
              <div className="produto-novo-chips">
                {sizeOptions.map((tam) => (
                  <button
                    key={tam}
                    type="button"
                    className={`produto-novo-chip${form.sizes.includes(tam) ? " is-on" : ""}`}
                    onClick={() => toggleSize(tam)}
                  >
                    {tam}
                  </button>
                ))}
              </div>
              <div className="produto-novo-color-add" style={{ marginTop: "0.65rem" }}>
                <input
                  type="text"
                  className="produto-novo-color-input"
                  placeholder="Outro tamanho (ex.: 38)"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={onEnter(addSize)}
                  maxLength={20}
                />
                <button
                  type="button"
                  className="produto-novo-chip"
                  onClick={addSize}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </section>

          <footer className="produto-novo-footer">
            {!isEdit ? (
              <button
                type="button"
                className="produto-novo-btn produto-novo-btn--ghost"
                onClick={handleDraftSave}
                disabled={saving}
              >
                Salvar rascunho
              </button>
            ) : null}
            <Link to={lojaPath} className="produto-novo-btn produto-novo-btn--ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="produto-novo-btn produto-novo-btn--primary"
              disabled={saving}
            >
              {isEdit
                ? saving
                  ? "Salvando…"
                  : "Salvar alterações"
                : saving
                  ? "Publicando…"
                  : "Publicar produto"}
            </button>
          </footer>
        </form>
      </div>

    </div>
  );
}
