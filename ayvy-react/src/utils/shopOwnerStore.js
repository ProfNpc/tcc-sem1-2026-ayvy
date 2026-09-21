/**
 * Dados mock do dono da loja: rascunhos e produtos publicados no navegador.
 * Depois substitui pela API.
 */

const DRAFTS_KEY = "ayvy.shop.drafts.v1";
const PUBLISHED_KEY = "ayvy.shop.published.v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function normalizeSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

export function listDrafts(shopSlug) {
  const slug = normalizeSlug(shopSlug);
  const all = readJson(DRAFTS_KEY, []);
  if (!Array.isArray(all)) return [];
  return all.filter((d) => normalizeSlug(d.shopSlug) === slug);
}

export function listPublishedExtras(shopSlug) {
  const slug = normalizeSlug(shopSlug);
  const all = readJson(PUBLISHED_KEY, []);
  if (!Array.isArray(all)) return [];
  return all.filter((p) => normalizeSlug(p.shopSlug) === slug);
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function imagesToPersistable(images) {
  const out = [];
  for (const img of images || []) {
    if (img.preview && String(img.preview).startsWith("data:")) {
      out.push(img.preview);
      continue;
    }
    if (img.file) {
      const data = await fileToDataUrl(img.file);
      if (data) out.push(data);
      continue;
    }
    if (img.preview) out.push(img.preview);
  }
  return out.slice(0, 6);
}

function formatPriceLabel(priceRaw) {
  const s = String(priceRaw || "").trim();
  if (!s) return "R$ 0,00";
  if (s.toUpperCase().includes("R$")) return s;
  return `R$ ${s}`;
}

/**
 * @param {{ shopSlug: string, form: object, images: Array, id?: string }} args
 */
export async function saveDraft({ shopSlug, form, images, id }) {
  const imageUrls = await imagesToPersistable(images);
  const draft = {
    id: id || `draft-${crypto.randomUUID()}`,
    shopSlug: normalizeSlug(shopSlug),
    title: String(form.title || "").trim() || "Sem título",
    description: String(form.description || "").trim(),
    category: form.category || "",
    price: formatPriceLabel(form.price),
    priceRaw: form.price || "",
    discountPercent: Number(form.discountPercent) || 0,
    stock: form.stock || "",
    sku: form.sku || "",
    colors: form.colors || [],
    sizes: form.sizes || [],
    images: imageUrls.length
      ? imageUrls
      : ["/assets/img/ayvy-media-a.png"],
    updatedAt: new Date().toISOString(),
  };

  const all = readJson(DRAFTS_KEY, []);
  const list = Array.isArray(all) ? all : [];
  const next = [draft, ...list.filter((d) => d.id !== draft.id)];
  writeJson(DRAFTS_KEY, next);
  return draft;
}

export function deleteDraft(draftId) {
  const all = readJson(DRAFTS_KEY, []);
  writeJson(
    DRAFTS_KEY,
    (Array.isArray(all) ? all : []).filter((d) => d.id !== draftId),
  );
}

/** Publica rascunho (sai de drafts e entra em publicados da loja). */
export function publishDraft(draftId) {
  const all = readJson(DRAFTS_KEY, []);
  const list = Array.isArray(all) ? all : [];
  const draft = list.find((d) => d.id === draftId);
  if (!draft) return null;

  writeJson(
    DRAFTS_KEY,
    list.filter((d) => d.id !== draftId),
  );

  const product = {
    id: `pub-${crypto.randomUUID()}`,
    shopSlug: draft.shopSlug,
    title: draft.title,
    description: draft.description,
    price: draft.price,
    discountPercent: draft.discountPercent,
    colors: draft.colors,
    sizes: draft.sizes?.length ? draft.sizes : ["U"],
    images: draft.images,
    soldCount: 0,
    rating: 5,
    publishedAt: new Date().toISOString(),
  };

  const pubs = readJson(PUBLISHED_KEY, []);
  writeJson(PUBLISHED_KEY, [product, ...(Array.isArray(pubs) ? pubs : [])]);
  return product;
}

/**
 * Publica direto do formulário (sem passar por rascunho).
 */
export async function publishProduct({ shopSlug, form, images }) {
  const imageUrls = await imagesToPersistable(images);
  const product = {
    id: `pub-${crypto.randomUUID()}`,
    shopSlug: normalizeSlug(shopSlug),
    title: String(form.title || "").trim() || "Produto",
    description: String(form.description || "").trim(),
    price: formatPriceLabel(form.price),
    discountPercent: Number(form.discountPercent) || 0,
    colors: form.colors || [],
    sizes: form.sizes?.length ? form.sizes : ["U"],
    images: imageUrls.length
      ? imageUrls
      : ["/assets/img/ayvy-media-a.png"],
    soldCount: 0,
    rating: 5,
    publishedAt: new Date().toISOString(),
  };

  const pubs = readJson(PUBLISHED_KEY, []);
  writeJson(PUBLISHED_KEY, [product, ...(Array.isArray(pubs) ? pubs : [])]);
  return product;
}

export function deletePublishedExtra(productId) {
  const pubs = readJson(PUBLISHED_KEY, []);
  writeJson(
    PUBLISHED_KEY,
    (Array.isArray(pubs) ? pubs : []).filter((p) => p.id !== productId),
  );
}
