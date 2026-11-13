/**
 * Vitrine pública: lojas e produtos ativos da API (GET /lojistas, GET /produtos).
 * Usado por: Home, Ranking, Categorias, Carrinho (importação do app) e utils/lojistaData.js.
 */
import { apiJson } from "./api";
import { resolveImageUrl } from "../utils/imageUrl";

export function listProdutosApi() {
  return apiJson("/produtos");
}

export function listLojistasApi() {
  return apiJson("/lojistas");
}

export function getProdutoApi(id) {
  return apiJson(`/produtos/${id}`);
}

/**
 * Monta o mapa estilo SHOPS a partir da API (lojistas + produtos ativos).
 */
export async function loadShopsFromApi() {
  const [lojistas, produtos] = await Promise.all([listLojistasApi(), listProdutosApi()]);
  const shops = {};

  for (const loja of lojistas || []) {
    const slug = String(loja.slug || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    if (!slug) continue;

    shops[slug] = {
      id: loja.id,
      name: loja.nomeLoja || slug,
      handle: `@${slug}`,
      bio: loja.descricao || "",
      avatar: resolveImageUrl(loja.logoUrl) || "https://i.pravatar.cc/150?u=" + slug,
      cover: resolveImageUrl(loja.bannerUrl) || "",
      status: loja.status || loja.statusLoja || "aprovado",
      products: [],
      _raw: loja,
    };
  }

  for (const p of produtos || []) {
    const status = String(p.status || p.statusProduto || "").toLowerCase();
    if (status && status !== "ativo") continue;

    const loja = p.lojista;
    const slug = String(loja?.slug || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    if (!slug || !shops[slug]) continue;

    shops[slug].products.push({
      id: String(p.id),
      apiId: p.id,
      title: p.nome,
      name: p.nome,
      ...precosDoProduto(p),
      href: resolveImageUrl(p.imagemPrincipalUrl) || "",
      img: resolveImageUrl(p.imagemPrincipalUrl) || "",
      images: p.imagemPrincipalUrl
        ? [resolveImageUrl(p.imagemPrincipalUrl)]
        : [],
      description: p.descricao || "",
      stock: Number(p.estoqueDisponivel) > 0 ? "disponivel" : "indisponivel",
      slug: p.slug,
      categoria: p.categoria?.nome || "",
      ...(Array.isArray(p.cores) ? { colors: p.cores } : {}),
      ...(Array.isArray(p.tamanhos) ? { sizes: p.tamanhos } : {}),
    });
  }

  return shops;
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Preço de vitrine com o desconto do lojista: `price` é o valor cobrado (precoFinal da API)
 * e `originalPrice` o preço cheio, só quando há desconto.
 */
export function precosDoProduto(p) {
  const cheio = Number(p.preco) || 0;
  const desconto = Math.max(0, Math.min(90, Number(p.descontoPercentual) || 0));
  const final = p.precoFinal != null ? Number(p.precoFinal) : cheio;
  return {
    price: formatPrice(final),
    priceValue: final,
    discountPercent: desconto,
    ...(desconto > 0 ? { originalPrice: formatPrice(cheio) } : {}),
  };
}
