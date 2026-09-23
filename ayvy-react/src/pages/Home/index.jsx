import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Banner from "../../components/Banner";
import BrandSlider from "../../components/BrandSlider";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import { listLojistasApi, listProdutosApi } from "../../services/shopApi";
import { listCategorias, mapApiProdutoToCard } from "../../services/lojistaApi";
import { HOME_BRANDS } from "../../utils/homeContent";
import { enrichProduct } from "../../utils/productHelpers";
import "./style.css";

const BANNER_IMG = "/assets/img/img-curta-ayvy.jpeg";
const PER_CATEGORY = 6;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function isProdutoAtivo(p) {
  const st = String(p?.status || p?.statusProduto || "").toLowerCase();
  return st === "ativo" || st === "";
}

function mapProdutoCard(p) {
  const card = mapApiProdutoToCard(p);
  const shopSlug = normalizeSlug(p.lojista?.slug);
  const shopName = p.lojista?.nomeLoja || shopSlug || "AYVY";
  const enriched = enrichProduct(
    { ...card, soldCount: Number(p.visualizacoesTotal) || card.soldCount },
    { name: shopName },
  );
  return {
    ...enriched,
    shopSlug: shopSlug || "loja",
    productId: String(p.id),
    categoryId: p.categoria?.id ?? null,
    categoryName: p.categoria?.nome || null,
  };
}

/**
 * Agrupa produtos ativos por categoria da API, com shuffle por seção.
 */
function buildCategorySections(produtos, categorias) {
  const ativos = (produtos || [])
    .filter((p) => isProdutoAtivo(p) && (p?.lojista?.slug || p?.lojista?.id))
    .map(mapProdutoCard)
    .filter((c) => c.shopSlug && c.productId);

  const byCat = new Map();
  const semCategoria = [];

  for (const card of ativos) {
    if (card.categoryId == null) {
      semCategoria.push(card);
      continue;
    }
    const key = Number(card.categoryId);
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(card);
  }

  const orderedCats = (categorias || []).filter(
    (c) => c?.ativo !== false && c?.id != null,
  );

  const sections = [];

  for (const cat of orderedCats) {
    const list = byCat.get(Number(cat.id)) || [];
    if (!list.length) continue;
    sections.push({
      id: cat.id,
      title: cat.nome || "Categoria",
      products: shuffle(list).slice(0, PER_CATEGORY),
    });
    byCat.delete(Number(cat.id));
  }

  // Categorias que existem só no produto (não listadas / inativas)
  for (const [id, list] of byCat) {
    if (!list.length) continue;
    sections.push({
      id,
      title: list[0].categoryName || "Categoria",
      products: shuffle(list).slice(0, PER_CATEGORY),
    });
  }

  if (semCategoria.length) {
    sections.push({
      id: "outros",
      title: "Outros",
      products: shuffle(semCategoria).slice(0, PER_CATEGORY),
    });
  }

  return sections;
}

function ProductGrid({ products }) {
  return (
    <div className="home-product-grid">
      {products.map((c) => (
        <Card
          key={`${c.productId}-${c.shopSlug}`}
          variant="product"
          title={c.title || c.name}
          img={c.images?.[0] || c.img || c.href}
          price={c.price}
          rating={c.rating}
          soldCount={c.soldCount}
          discountPercent={c.discountPercent || 0}
          productId={c.productId}
          shopSlug={c.shopSlug}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const location = useLocation();
  const [sections, setSections] = useState([]);
  const [brands, setBrands] = useState(HOME_BRANDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.hash === "#support-section") {
      requestAnimationFrame(() => {
        document.getElementById("support-section")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [produtos, lojistas, categorias] = await Promise.all([
          listProdutosApi(),
          listLojistasApi(),
          listCategorias().catch(() => []),
        ]);

        const brandNames = (lojistas || [])
          .map((l) => String(l.nomeLoja || "").toUpperCase())
          .filter(Boolean);

        const nextSections = buildCategorySections(produtos, categorias);

        if (!cancelled) {
          setSections(nextSections);
          if (brandNames.length) setBrands(brandNames);
        }
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  const totalProducts = sections.reduce((n, s) => n + s.products.length, 0);

  return (
    <>
      <Banner imageSrc={BANNER_IMG} imageAlt="AYVY Logo">
        <div className="search-overlay-center" id="search-section">
          <h1 className="main-title">A plataforma de visibilidade para o seu negócio</h1>
          <div className="search-bar-clean">
            <input
              type="text"
              placeholder="Busque por lojas, produtos ou tendências..."
              name="q"
            />
            <button type="button" className="btn-search-black">
              <i className="fas fa-search" /> Pesquisar
            </button>
          </div>
          <p className="sub-text-hero">Conectando lojistas e clientes em um só lugar.</p>
        </div>
      </Banner>

      <BrandSlider title="Empresas em destaque na plataforma:" brands={brands} />

      <main className="content-profiles">
        <div className="container">
          <h2 className="section-title-center">Explore produtos em alta</h2>
          {loading ? (
            <p className="home-products-hint">Carregando produtos…</p>
          ) : null}
          {!loading && totalProducts === 0 ? (
            <p className="home-products-hint">
              Nenhum produto ativo na API no momento. Cadastre produtos como lojista
              (com categoria e status publicado) para vê-los aqui.
            </p>
          ) : null}

          {sections.map((section) => (
            <section key={section.id} className="home-category-block">
              <h3 className="home-category-title">{section.title}</h3>
              <ProductGrid products={section.products} />
            </section>
          ))}
        </div>
      </main>

      <Footer variant="support" />
    </>
  );
}
