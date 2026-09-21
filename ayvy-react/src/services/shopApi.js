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
      price: formatPrice(Number(p.preco) || 0),
      href: resolveImageUrl(p.imagemPrincipalUrl) || "",
      img: resolveImageUrl(p.imagemPrincipalUrl) || "",
      images: p.imagemPrincipalUrl
        ? [resolveImageUrl(p.imagemPrincipalUrl)]
        : [],
      description: p.descricao || "",
      stock: (p.estoque ?? 0) > 0 ? "disponivel" : "indisponivel",
      slug: p.slug,
      categoria: p.categoria?.nome || "",
    });
  }

  return shops;
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
