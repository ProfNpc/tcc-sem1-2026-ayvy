export const SHOPS = {
    rafaele_fashion: {
      name: "Rafaele Fashion",
      handle: "@rafaele_fashion",
      avatar: "https://i.pravatar.cc/120?u=1",
      bio: "Moda feminina autoral. Enviamos para todo o Brasil.",
      monthsOnAyvy: 31,
      reviewCount: 18,
      followers: "12,4 mil",
      chatResponseRate: "83%",
      stats: [
        { label: "produtos", value: "12" },
        { label: "seguidores", value: "12,4 mil" },
        { label: "avaliação", value: "4,9" },
      ],
      products: [
        {
          id: "rf-1",
          title: "Leather jacket",
          price: "R$ 599,90",
          discountPercent: 15,
          soldCount: 1200,
          images: ["/assets/img/Leather_Jacket.jpg",
          "/assets/img/Leather_Jacket2.jpg", "/assets/img/red_leather.jpg", "/assets/img/Leather_branca.jpg", ],
          description:
            "Jaqueta de couro legitimo, ideal para dias frios.",
        },
        {
          id: "rf-2",
          title: "Tenis Samba",
          price: "R$ 149,00",
          pricePix: "R$ 119,",
          priceOther: "R$ 149,00",
          images: [
            "/assets/img/samba.jpg",
            "https://images.unsplash.com/photo-1572804013309-59a698b3e0f4?w=600",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
          ],
          colors: ["Branco", "Vinho", "Preto", "Bordô"],
          sizes: ["PP", "P", "M", "G", "GG"],
          rating: 5,
          reviewCount: 1,
          soldCount: 3,
          favoriteCount: 374,
          categoryPath: ["AYVY", "Roupas Femininas", "Vestidos"],
          originCountry: "Brasil",
          shipsFrom: "São Paulo",
          description:
            "Produto sob encomenda. Estampa exclusiva, forro interno e zíper invisível nas costas. Caso queira algum detalhe ou cor diferente, entre em contato pelo chat.",
          reviews: [
            {
              id: "rf2-r1",
              user: "f*****s",
              avatar: "https://i.pravatar.cc/48?u=rf2r1",
              rating: 5,
              date: "2026-04-17 12:56",
              variation: "Vermelho, PP",
              attributes: [
                { label: "Qualidade", value: "boa" },
                { label: "Estilo", value: "festa" },
                { label: "Conforto", value: "ótimo acabamento" },
              ],
              text: "Vestido lindo, caimento perfeito!",
            },
          ],
        },
        {
          id: "rf-3",
          title: "Blazer alfaiataria",
          price: "R$ 329,90",
          images: [
            "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600",
            "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600",
          ],
          description: "Corte estruturado, ombreiras leves. Compõe look trabalho ou evento.",
        },
        {
          id: "rf-4",
          title: "Calça wide leg",
          price: "R$ 179,90",
          images: [
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
          ],
          description: "Cintura alta, comprimento alongado. Tecido com elastano.",
        },
        {
          id: "rf-5",
          title: "Saia plissada",
          price: "R$ 139,90",
          images: [
            "https://images.unsplash.com/photo-1583496661160-fb5886a0aa0b?w=600",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600",
          ],
          description: "Plissado permanente, fechamento lateral com botão.",
        },
        {
          id: "rf-6",
          title: "Top canelado",
          price: "R$ 89,90",
          images: [
            "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600",
            "https://images.unsplash.com/photo-1581044777550-2e27733c9423?w=600",
          ],
          description: "Malha canelada premium, alças ajustáveis.",
        },
        {
          id: "rf-7",
          title: "Vestido midi floral",
          price: "R$ 199,90",
          discountPercent: 10,
          soldCount: 520,
          images: [
            "https://images.unsplash.com/photo-1572804013309-59a698b3e0f4?w=600",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600",
          ],
          description: "Estampa floral delicada, mangas bufantes.",
        },
        {
          id: "rf-8",
          title: "Colete tricot",
          price: "R$ 119,90",
          soldCount: 310,
          images: [
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
          ],
          description: "Tricot macio, ideal para sobreposição.",
        },
        {
          id: "rf-9",
          title: "Bolsa tiracolo couro",
          price: "R$ 159,90",
          discountPercent: 25,
          soldCount: 780,
          images: [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
          ],
          description: "Couro sintético premium, alça ajustável.",
        },
        {
          id: "rf-10",
          title: "Casaco tweed",
          price: "R$ 389,90",
          soldCount: 95,
          images: [
            "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600",
            "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600",
          ],
          description: "Tweed clássico, forro acetinado, botões dourados.",
        },
        {
          id: "rf-11",
          title: "Camisa social oversized",
          price: "R$ 149,90",
          discountPercent: 18,
          soldCount: 445,
          images: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2f?w=600",
          ],
          description: "Algodão egípcio, corte relaxado, punho duplo.",
        },
        {
          id: "rf-12",
          title: "Cinto fino dourado",
          price: "R$ 69,90",
          soldCount: 620,
          images: [
            "https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=600",
          ],
          description: "Fivela dourada, couro sintético macio.",
        },
      ],
    },
    livre_store: {
      name: "Livre Store",
      handle: "@livre_store",
      avatar: "https://i.pravatar.cc/120?u=2",
      bio: "Streetwear e básicos com atitude. Drops toda sexta.",
      stats: [
        { label: "produtos", value: "12" },
        { label: "seguidores", value: "8,1 mil" },
        { label: "avaliação", value: "4,8" },
      ],
      products: [
        {
          id: "ls-1",
          title: "Moletom oversized",
          price: "R$ 199,90",
          discountPercent: 20,
          soldCount: 890,
          images: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
            "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600",
          ],
          description: "Capuz duplo, bolso canguru. Interior felpado.",
        },
        {
          id: "ls-2",
          title: "Camiseta boxy",
          price: "R$ 79,90",
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
          ],
          description: "Algodão penteado 180g, gola canelada reforçada.",
        },
        {
          id: "ls-3",
          title: "Boné dad hat",
          price: "R$ 69,90",
          images: [
            "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600",
            "https://images.unsplash.com/photo-1534215754734-75e352d1abce?w=600",
          ],
          description: "Bordado frontal, regulagem de metal.",
        },
        {
          id: "ls-4",
          title: "Calça cargo",
          price: "R$ 259,90",
          images: [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80",
          ],
          description: "Bolsos laterais amplos, elástico no tornozelo.",
        },
        {
          id: "ls-5",
          title: "Jaqueta corta-vento",
          price: "R$ 229,90",
          discountPercent: 18,
          soldCount: 640,
          images: [
            "https://images.unsplash.com/photo-1523381210438-271e8be1f52b?w=600",
          ],
          description: "Tecido impermeável leve, capuz embutido.",
        },
        {
          id: "ls-6",
          title: "Shorts sarja",
          price: "R$ 99,90",
          soldCount: 420,
          images: [
            "https://images.unsplash.com/photo-1591195853828-4818bea705c9?w=600",
          ],
          description: "Sarja resistente, corte relaxed.",
        },
        {
          id: "ls-7",
          title: "Tênis chunky branco",
          price: "R$ 279,90",
          soldCount: 1100,
          images: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600",
          ],
          description: "Solado robusto, palmilha memory foam.",
        },
        {
          id: "ls-8",
          title: "Regata dry fit",
          price: "R$ 59,90",
          discountPercent: 12,
          soldCount: 2100,
          images: [
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600",
          ],
          description: "Tecido respirável, ideal para treino.",
        },
        {
          id: "ls-9",
          title: "Mochila urban",
          price: "R$ 149,90",
          soldCount: 380,
          images: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
          ],
          description: "Compartimento para notebook até 15 polegadas.",
        },
        {
          id: "ls-10",
          title: "Óculos de sol retro",
          price: "R$ 89,90",
          soldCount: 560,
          images: [
            "https://images.unsplash.com/photo-1572635196233-8f9923e94b46?w=600",
          ],
          description: "Lentes UV400, armação acetato.",
        },
        {
          id: "ls-11",
          title: "Puffer jacket nylon",
          price: "R$ 349,90",
          discountPercent: 22,
          soldCount: 290,
          images: [
            "https://images.unsplash.com/photo-1548126032-079b996c4bf7?w=600",
          ],
          description: "Enchimento leve, capuz removível, impermeável.",
        },
        {
          id: "ls-12",
          title: "Meia cano alto pack 3",
          price: "R$ 39,90",
          soldCount: 1800,
          images: [
            "https://images.unsplash.com/photo-1586350977771-b3b0a50c4b1c?w=600",
          ],
          description: "Algodão com elastano, cores variadas no kit.",
        },
      ],
    },
    itb_moda: {
      name: "ITB Moda",
      handle: "@itb_moda",
      avatar: "https://i.pravatar.cc/120?u=3",
      bio: "Curadoria acadêmica + tendências. Projeto integrador AYVY.",
      stats: [
        { label: "produtos", value: "12" },
        { label: "seguidores", value: "3,2 mil" },
        { label: "avaliação", value: "5,0" },
      ],
      products: [
        {
          id: "im-1",
          title: "Vestido jeans vintage",
          price: "R$ 219,90",
          images: ["/assets/img/vestidojeans.png"],
          description: "Lavagem média, modelagem reta. Peça única do acervo.",
        },
        {
          id: "im-2",
          title: "Macacão utilitário",
          price: "R$ 289,00",
          images: [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
          ],
          description: "Tecido encorpado, cinto removível e bolsos funcionais.",
        },
        {
          id: "im-3",
          title: "Sandália plataforma",
          price: "R$ 159,90",
          images: [
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600",
            "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600",
          ],
          description: "Solado leve, palmilha acolchoada.",
        },
        {
          id: "im-4",
          title: "Blusa cropped renda",
          price: "R$ 79,90",
          discountPercent: 20,
          soldCount: 430,
          images: [
            "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600",
          ],
          description: "Renda delicada, forro interno.",
        },
        {
          id: "im-5",
          title: "Calça pantalona",
          price: "R$ 169,90",
          soldCount: 290,
          images: [
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
          ],
          description: "Cintura alta, pernas amplas, tecido fluido.",
        },
        {
          id: "im-6",
          title: "Jaqueta jeans oversized",
          price: "R$ 239,90",
          soldCount: 180,
          images: [
            "https://images.unsplash.com/photo-1541093602413-3bff903b302f?w=600",
          ],
          description: "Denim médio, lavagem vintage.",
        },
        {
          id: "im-7",
          title: "Tênis casual canvas",
          price: "R$ 129,90",
          discountPercent: 15,
          soldCount: 920,
          images: [
            "https://images.unsplash.com/photo-1460353589841-61b2bc694979?w=600",
          ],
          description: "Canvas respirável, solado de borracha.",
        },
        {
          id: "im-8",
          title: "Bolsa tote acadêmica",
          price: "R$ 99,90",
          soldCount: 510,
          images: [
            "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600",
          ],
          description: "Espaçosa para cadernos e notebook.",
        },
        {
          id: "im-9",
          title: "Lenço estampado",
          price: "R$ 49,90",
          soldCount: 150,
          images: [
            "https://images.unsplash.com/photo-1584917865442-89aaaabddaab?w=600",
          ],
          description: "Seda sintética, estampa geométrica.",
        },
        {
          id: "im-10",
          title: "Conjunto moletom college",
          price: "R$ 199,90",
          soldCount: 670,
          images: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
          ],
          description: "Moletom + calça, bordado ITB.",
        },
        {
          id: "im-11",
          title: "Vestido midi acetinado",
          price: "R$ 219,90",
          discountPercent: 12,
          soldCount: 340,
          images: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
          ],
          description: "Tecido acetinado com brilho suave, ideal para eventos.",
        },
        {
          id: "im-12",
          title: "Cardigan tricô oversize",
          price: "R$ 149,90",
          soldCount: 410,
          images: [
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
          ],
          description: "Tricot confortável, botões frontais, caimento amplo.",
        },
      ],
    },
};

export const DEFAULT_SLUG = "rafaele_fashion";

/** Métricas simuladas para o Painel profissional (dono da loja) */
const SHOP_ANALYTICS = {
    livre_store: {
      views7d: [1200, 1350, 1280, 1420, 1510, 1480, 1620],
      reachAccounts: [8100, 8200, 8050, 8300, 8400, 8350, 8480],
      salesByDay: [420, 380, 510, 490, 620, 580, 640],
      salesMonthTotal: 18420,
      salesPrevMonthTotal: 16200,
    },
    rafaele_fashion: {
      views7d: [2100, 2050, 2180, 2300, 2280, 2400, 2520],
      reachAccounts: [12400, 12350, 12480, 12520, 12600, 12580, 12700],
      salesByDay: [890, 920, 780, 950, 910, 880, 1020],
      salesMonthTotal: 25680,
      salesPrevMonthTotal: 24100,
    },
    itb_moda: {
      views7d: [600, 580, 620, 640, 610, 650, 680],
      reachAccounts: [3100, 3080, 3150, 3200, 3180, 3220, 3250],
      salesByDay: [210, 190, 230, 220, 250, 240, 260],
      salesMonthTotal: 8920,
      salesPrevMonthTotal: 9100,
    },
};

export function getShopAnalytics(slug) {
  const key = normalizeSlugParam(slug);
  return SHOP_ANALYTICS[key] || SHOP_ANALYTICS.livre_store;
}

export function normalizeSlugParam(value) {
  let s = String(value || "")
    .trim()
    .toLowerCase();
  s = s.replace(/^[./?#]+/, "").replace(/[.\s,;:!?]+$/g, "");
  return s;
}

export function getSlugFromSearchParams(searchParams) {
  const raw = normalizeSlugParam(
    searchParams.get("loja") || searchParams.get("shop") || "",
  );
  if (raw && SHOPS[raw]) return raw;
  if (raw) return null;
  return DEFAULT_SLUG;
}

export function findProduct(slug, productId) {
  const shop = SHOPS[slug];
  if (!shop || !productId) return null;
  const product = shop.products.find((x) => x.id === productId);
  return product ? { shop, product } : null;
}
