/** Metadados padrão para produtos mock (até integração com API). */
const DEFAULT_COLORS = ["Preto", "Branco", "Bege", "Vermelho", "Azul"];
const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG"];

const COLOR_ALIASES = {
  Preto: ["preto", "preta", "black", "blk"],
  Branco: ["branco", "branca", "white", "wht", "off"],
  Bege: ["bege", "beige"],
  Vermelho: ["vermelho", "vermelha", "red", "vinho"],
  Azul: ["azul", "blue", "jeans"],
  Verde: ["verde", "green"],
  Rosa: ["rosa", "pink"],
  Cinza: ["cinza", "grey", "gray"],
  Marrom: ["marrom", "brown", "cafe", "couro"],
  Amarelo: ["amarelo", "amarela", "yellow"],
  Roxo: ["roxo", "roxa", "purple", "lilas", "track"],
};

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
  const productCount = (shop.products || []).length;
  return {
    ...shop,
    slug,
    monthsOnAyvy: shop.monthsOnAyvy ?? 24,
    reviewCount: shop.reviewCount ?? 18,
    followers: shop.followers ?? "359",
    chatResponseRate: shop.chatResponseRate ?? "83%",
    productCount,
    stats: shop.stats ?? [
      { label: "produtos", value: productCount },
      { label: "avaliações", value: shop.reviewCount ?? 18 },
      { label: "seguidores", value: shop.followers ?? "359" },
    ],
  };
}

function normalizeFile(src) {
  return String(src || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function colorTokens(color) {
  const c = String(color || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  for (const [name, aliases] of Object.entries(COLOR_ALIASES)) {
    if (c.includes(name.toLowerCase()) || aliases.some((a) => c.includes(a))) {
      return aliases;
    }
  }
  return [c.split(/\s+/)[0]].filter(Boolean);
}

function findColorInFilename(src) {
  const file = normalizeFile(src);
  for (const [name, aliases] of Object.entries(COLOR_ALIASES)) {
    if (aliases.some((a) => file.includes(a))) return name;
  }
  return null;
}

/** Infere cores a partir dos nomes das imagens (qualquer loja). */
function inferColorsFromImages(images) {
  const found = [];
  for (const src of images) {
    const name = findColorInFilename(src);
    if (name && !found.includes(name)) found.push(name);
  }
  return found;
}

/**
 * Monta mapa cor → imagem.
 * Prioridade: colorImages explícito → match no nome do arquivo → sobras por ordem.
 */
export function buildColorImages(images, colors, explicit) {
  const map = { ...(explicit || {}) };
  if (!images?.length || !colors?.length) return map;

  const used = new Set();
  for (const color of colors) {
    if (map[color]) {
      const idx = images.indexOf(map[color]);
      if (idx >= 0) used.add(idx);
      continue;
    }
    const tokens = colorTokens(color);
    const found = images.findIndex(
      (src, i) => !used.has(i) && tokens.some((t) => normalizeFile(src).includes(t)),
    );
    if (found >= 0) {
      map[color] = images[found];
      used.add(found);
    }
  }

  let ui = 0;
  for (const color of colors) {
    if (map[color]) continue;
    while (ui < images.length && used.has(ui)) ui += 1;
    if (ui < images.length) {
      map[color] = images[ui];
      used.add(ui);
      ui += 1;
    } else {
      map[color] = images[0];
    }
  }
  return map;
}

/**
 * Imagem da variante de cor (qualquer loja).
 */
export function getImageForColor(product, colorName) {
  const images = product?.images ?? [];
  if (!images.length) return "/assets/img/ayvy-media-a.png";
  if (!colorName) return images[0];

  const color = String(colorName).trim();
  const colors = product.colors ?? [];
  const colorImages = buildColorImages(images, colors.length ? colors : [color], product.colorImages);

  if (colorImages[color]) return colorImages[color];

  const byKey = Object.keys(colorImages).find(
    (k) => k.toLowerCase() === color.toLowerCase(),
  );
  if (byKey) return colorImages[byKey];

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

export function enrichProduct(product, shop) {
  const categoryPath = product.categoryPath ?? [
    "AYVY",
    shop.name,
    "Moda",
  ];
  const images =
    product.images ??
    (product.href ? [product.href.replace(/^public\//, "/")] : []);

  const inferred = inferColorsFromImages(images);
  const colors =
    product.colors ??
    (inferred.length
      ? inferred
      : DEFAULT_COLORS.slice(0, Math.min(Math.max(images.length, 1), 5)));

  const colorImages = buildColorImages(images, colors, product.colorImages);

  return {
    ...product,
    images,
    colors,
    colorImages,
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
