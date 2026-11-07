/**
 * Cadastro e edição de produto do lojista (/loja/:slug/produto/novo e /:productId/editar).
 * Fotos, nome, descrição, categoria (CategoriaPicker), preço, estoque, cores e tamanhos.
 * Salva via services/lojistaApi.js (POST/PUT /produtos, /upload, /produtos/{id}/imagens).
 */
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import CategoriaPicker, { categoriaCompleta } from "./CategoriaPicker";
import SucessoModal from "./SucessoModal";
import { isShopOwner } from "../../../utils/mockAuthUsers";
import { normalizeSlugParam } from "../../../utils/lojistaData";
import { formatBRL } from "../../../utils/cartHelpers";
import {
  atualizarProdutoLojista,
  carregarProdutoParaEdicao,
  listCategorias,
  salvarProdutoLojista,
} from "../../../services/lojistaApi";
import "./style.css";

const TAMANHOS_ROUPA = ["PP", "P", "M", "G", "GG", "XG", "Único"];
const numeracao = (de, ate) => Array.from({ length: ate - de + 1 }, (_, i) => String(de + i));
const TAMANHOS_CALCADO_INFANTIL = numeracao(13, 32);
const TAMANHOS_CALCADO_ADULTO = numeracao(33, 46);
const TAMANHOS_PADRAO = [...TAMANHOS_ROUPA, ...TAMANHOS_CALCADO_INFANTIL, ...TAMANHOS_CALCADO_ADULTO];
const PALAVRAS_CALCADO = ["calcado", "tenis", "bota", "sandalia", "sapat", "chinelo", "rasteira"];
const PALAVRAS_INFANTIL = ["infantil", "bebe", "menina", "menino", "sapatinho"];
const PRECO_MAX_DIGITOS = 9;

/** Máscara de dinheiro: os dígitos digitados viram centavos ("55000" → "550,00", "123456" → "1.234,56"). */
function mascaraPreco(valor) {
  const digitos = String(valor || "").replace(/\D/g, "").replace(/^0+/, "").slice(0, PRECO_MAX_DIGITOS);
  if (!digitos) return "";
  return (Number(digitos) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  price: "",
  discountPercent: "",
  stock: "",
  extraCategoryIds: [],
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
  const [extraAberta, setExtraAberta] = useState(false);
  const [sucesso, setSucesso] = useState(null);
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
    updateField("price", mascaraPreco(raw));
  }

  function handleDiscountChange(raw) {
    const digitos = String(raw || "").replace(/\D/g, "").slice(0, 2);
    updateField("discountPercent", digitos ? String(Math.min(90, Number(digitos))) : "");
  }

  async function persist(status) {
    if (!user?.lojistaId) {
      alert("Sessão de lojista incompleta. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      const criado = await salvarProdutoLojista({
        lojistaId: user.lojistaId,
        form,
        images,
        status,
        categoriaId: form.categoryId || null,
      });
      setSucesso({ tipo: status === "ativo" ? "publicado" : "rascunho", produtoId: criado?.id });
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
      const criado = await salvarProdutoLojista({
        lojistaId: user.lojistaId,
        form: formDraft,
        images,
        status: "rascunho",
        categoriaId: form.categoryId || null,
      });
      setSucesso({ tipo: "rascunho", produtoId: criado?.id });
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
      await persist("ativo");
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

  const tamanhosExtras = form.sizes.filter((s) => !TAMANHOS_PADRAO.includes(s));
  const categoriaAtual = categorias.find((c) => String(c.id) === String(form.categoryId));
  const textoCategoria = [categoriaAtual?.slug, categoriaAtual?.categoriaPai?.slug].join(" ");
  const ehCalcado = PALAVRAS_CALCADO.some((p) => textoCategoria.includes(p));
  const ehInfantil = PALAVRAS_INFANTIL.some((p) => textoCategoria.includes(p));
  const precoNumero = Number(String(form.price || "").replace(/\./g, "").replace(",", "."));
  const descontoNumero = Math.min(90, Math.max(0, Math.round(Number(form.discountPercent) || 0)));
  const precoComDesconto =
    Number.isFinite(precoNumero) && precoNumero > 0 && descontoNumero > 0
      ? (precoNumero * (100 - descontoNumero)) / 100
      : null;
  const grupoRoupa = { titulo: "Tamanhos de roupa", opcoes: TAMANHOS_ROUPA };
  const grupoAdulto = { titulo: "Calçado adulto (33 ao 46)", opcoes: TAMANHOS_CALCADO_ADULTO };
  const grupoInfantil = { titulo: "Calçado infantil (13 ao 32)", opcoes: TAMANHOS_CALCADO_INFANTIL };
  const gruposTamanho = !ehCalcado
    ? [grupoRoupa, grupoAdulto, grupoInfantil]
    : ehInfantil
      ? [grupoInfantil, grupoAdulto, grupoRoupa]
      : [grupoAdulto, grupoInfantil, grupoRoupa];
  if (tamanhosExtras.length) gruposTamanho.push({ titulo: "Outros tamanhos", opcoes: tamanhosExtras });

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

            <div className="produto-novo-cat-extra">
              {extraAberta || form.extraCategoryIds.length > 0 ? (
                <>
                  <div className="produto-novo-cat-extra__head">
                    <strong>Categoria adicional (opcional)</strong>
                    <button
                      type="button"
                      className="produto-novo-cat-extra__remove"
                      onClick={() => {
                        updateField("extraCategoryIds", []);
                        setExtraAberta(false);
                      }}
                    >
                      <i className="fas fa-times" aria-hidden /> Remover
                    </button>
                  </div>
                  <p className="produto-novo-hint">
                    O produto também aparece nesta categoria. Ex.: tênis em Calçados › Tênis e em
                    Streetwear › Tênis streetwear.
                  </p>
                  <CategoriaPicker
                    categorias={categorias}
                    value={form.extraCategoryIds[0] || ""}
                    onChange={(id) => updateField("extraCategoryIds", id ? [id] : [])}
                    obrigatorio={false}
                    ocultarIds={form.categoryId ? [Number(form.categoryId)] : []}
                  />
                </>
              ) : (
                <button
                  type="button"
                  className="produto-novo-chip produto-novo-cat-extra__add"
                  onClick={() => setExtraAberta(true)}
                >
                  <i className="fas fa-plus" aria-hidden /> Adicionar outra categoria (ex.: Streetwear)
                </button>
              )}
            </div>
          </section>

          <section className="produto-novo-card">
            <h2>
              <i className="fas fa-dollar-sign" aria-hidden /> Preço e estoque
            </h2>

            <div className="produto-novo-row">
              <label className="produto-novo-field">
                <span>Preço *</span>
                <span className="produto-novo-adorno">
                  <span className="produto-novo-adorno__txt">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                  />
                </span>
              </label>
              <label className="produto-novo-field">
                <span>Desconto</span>
                <span className="produto-novo-adorno produto-novo-adorno--fim">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                  />
                  <span className="produto-novo-adorno__txt">%</span>
                </span>
              </label>
            </div>
            {precoComDesconto != null ? (
              <p className="produto-novo-desconto">
                <i className="fas fa-tag" aria-hidden /> Com {descontoNumero}% de desconto o cliente
                paga <strong>{formatBRL(precoComDesconto)}</strong>{" "}
                <s>{formatBRL(precoNumero)}</s> — vale na vitrine e no checkout.
              </p>
            ) : null}

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
              {gruposTamanho.map((grupo) => (
                <div key={grupo.titulo} className="produto-novo-tamanhos">
                  <span className="produto-novo-chips-label">{grupo.titulo}</span>
                  <div className="produto-novo-chips">
                    {grupo.opcoes.map((tam) => (
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
                </div>
              ))}
              <div className="produto-novo-color-add" style={{ marginTop: "0.65rem" }}>
                <input
                  type="text"
                  className="produto-novo-color-input"
                  placeholder="Outro tamanho (ex.: 34/35, 2 anos)"
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

      {sucesso ? (
        <SucessoModal
          titulo={
            sucesso.tipo === "publicado" ? "Produto cadastrado com sucesso!" : "Rascunho salvo com sucesso!"
          }
          mensagem={
            sucesso.tipo === "publicado"
              ? `"${form.title.trim()}" já está publicado e aparece na sua loja.`
              : "Você pode terminar e publicar depois, na aba Rascunhos da sua loja."
          }
          imagem={images[0]?.preview}
          acoes={
            sucesso.tipo === "publicado"
              ? [
                  ...(sucesso.produtoId
                    ? [
                        {
                          to: `${lojaPath}/p/${sucesso.produtoId}`,
                          label: "Ver meu produto",
                          icone: "fa-eye",
                          primaria: true,
                        },
                      ]
                    : []),
                  { to: `${lojaPath}?aba=produtos`, label: "Voltar para minha loja", icone: "fa-store" },
                ]
              : [
                  {
                    to: `${lojaPath}?aba=rascunhos`,
                    label: "Ver meus rascunhos",
                    icone: "fa-file-alt",
                    primaria: true,
                  },
                  { to: `${lojaPath}?aba=produtos`, label: "Voltar para minha loja", icone: "fa-store" },
                ]
          }
          onClose={() => navigate(`${lojaPath}?aba=${sucesso.tipo === "publicado" ? "produtos" : "rascunhos"}`, { replace: true })}
        />
      ) : null}
    </div>
  );
}
