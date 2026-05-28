/** Metadados padrão para produtos mock (até integração com API). */
const DEFAULT_COLORS = ["Preto", "Branco", "Bege", "Vermelho", "Azul"];
const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG"];

const SAMPLE_REVIEWS = [
  {
    id: "r1",
    user: "m*****a",
    avatar: "https://i.pravatar.cc/48?u=rev1",
    rating: 5,
    date: "2026-04-12 14:22",
    variation: "Preto, M",
    attributes: [
      { label: "Qualidade", value: "boa" },
      { label: "Estilo", value: "casual" },
      { label: "Conforto", value: "ótimo acabamento" },
    ],
    text: "Produto lindo, chegou bem embalado. Recomendo a loja!",
  },
  {
    id: "r2",
    user: "j*****s",
    avatar: "https://i.pravatar.cc/48?u=rev2",
    rating: 4,
    date: "2026-03-28 09:10",
    variation: "Branco, G",
    attributes: [
      { label: "Qualidade", value: "muito boa" },
      { label: "Tamanho", value: "fiel ao anunciado" },
    ],
    text: "Gostei bastante, só demorou um pouco o frete.",
  },
];

export function enrichShop(shop, slug) {
  const productCount = shop.products.length;
  return {
    ...shop,
    slug,
    monthsOnAyvy: shop.monthsOnAyvy ?? 24,
    reviewCount: shop.reviewCount ?? 18,
    followers: shop.followers ?? "359",
    chatResponseRate: shop.chatResponseRate ?? "83%",
    productCount,
  };
}

export function enrichProduct(product, shop) {
  const categoryPath = product.categoryPath ?? [
    "AYVY",
    shop.name,
    "Moda",
  ];
  const images =
    product.images ??
    (product.href ? [product.href.replace(/^public\//, "/")] : []);
  return {
    ...product,
    images,
    colors: product.colors ?? DEFAULT_COLORS.slice(0, 5),
    sizes: product.sizes ?? DEFAULT_SIZES,
    rating: product.rating ?? 4.9,
    reviewCount: product.reviewCount ?? (product.reviews?.length ?? 12),
    soldCount: product.soldCount ?? 47,
    favoriteCount: product.favoriteCount ?? 128,
    stockLabel:
      product.stock === "indisponivel" ? "Sem estoque" : "Estoque disponível",
    stock: product.stock ?? "disponivel",
    originCountry: product.originCountry ?? "Brasil",
    shipsFrom: product.shipsFrom ?? "São Paulo",
    categoryPath,
    reviews: product.reviews ?? SAMPLE_REVIEWS,
    pricePix: product.pricePix ?? product.price,
    priceOther: product.priceOther ?? product.price,
    discountPercent: product.discountPercent ?? 0,
  };
}

export function formatSoldLabel(count) {
  const n = Number(count) || 0;
  if (n >= 10000) return `${Math.floor(n / 1000)}mil+ vendidos`;
  if (n >= 1000) return "1mil+ vendidos";
  return `${n} vendido(s)`;
}

export function renderStars(rating, max = 5) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return Array.from({ length: max }, (_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
}
