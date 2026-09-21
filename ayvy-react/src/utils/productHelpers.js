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

/**
 * Imagem da variante de cor (qualquer loja).
 * Ordem: colorImages explícito → índice da cor em colors[] → palavra da cor no nome do arquivo → 1ª foto.
 */
export function getImageForColor(product, colorName) {
  const images = product?.images ?? [];
  if (!images.length) return "/assets/img/ayvy-media-a.png";
  if (!colorName) return images[0];

  const color = String(colorName).trim();
  if (product.colorImages?.[color]) return product.colorImages[color];

  const colors = product.colors ?? [];
  const idx = colors.findIndex(
    (c) => String(c).toLowerCase() === color.toLowerCase(),
  );
  if (idx >= 0 && images[idx]) return images[idx];

  const tokens = colorTokens(color);
  const byFile = images.find((src) => {
    const file = String(src).toLowerCase();
    return tokens.some((t) => file.includes(t));
  });
  if (byFile) return byFile;

  if (idx >= 0) return images[Math.min(idx, images.length - 1)];
  return images[0];
}

/** Índice da imagem da cor na galeria (para sincronizar o carrossel). */
export function getColorImageIndex(product, colorName) {
  const images = product?.images ?? [];
  if (!images.length) return 0;
  const src = getImageForColor(product, colorName);
  const i = images.indexOf(src);
  return i >= 0 ? i : 0;
}

function colorTokens(color) {
  const c = String(color).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const map = {
    preto: ["preto", "black", "blk"],
    branco: ["branco", "white", "wht"],
    bege: ["bege", "beige"],
    vermelho: ["vermelho", "red", "vinho"],
    azul: ["azul", "blue", "jeans"],
    verde: ["verde", "green"],
    rosa: ["rosa", "pink"],
    cinza: ["cinza", "grey", "gray"],
    marrom: ["marrom", "brown", "cafe"],
    amarelo: ["amarelo", "yellow"],
    roxo: ["roxo", "purple", "lilas"],
  };
  for (const [key, aliases] of Object.entries(map)) {
    if (c.includes(key) || aliases.some((a) => c.includes(a))) return aliases;
  }
  return [c.split(/\s+/)[0]].filter(Boolean);
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
  const colors =
    product.colors ??
    (images.length >= 2 && images.length <= 5
      ? DEFAULT_COLORS.slice(0, images.length)
      : DEFAULT_COLORS.slice(0, 5));
  return {
    ...product,
    images,
    colors,
    colorImages: product.colorImages,
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
