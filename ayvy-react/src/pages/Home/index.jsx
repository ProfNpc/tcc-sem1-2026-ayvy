import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Banner from "../../components/Banner";
import BrandSlider from "../../components/BrandSlider";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import { listLojistasApi, listProdutosApi } from "../../services/shopApi";
import { listCategorias, mapApiProdutoToCard } from "../../services/lojistaApi";
import { HOME_BRANDS } from "../../utils/homeContent";
import { enrichProduct } from "../../utils/productHelpers";
import { resolveImageUrl } from "../../utils/imageUrl";
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

function normalizeQuery(raw) {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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
    shopName,
    productId: String(p.id),
    categoryId: p.categoria?.id ?? null,
    categoryName: p.categoria?.nome || null,
    searchText: normalizeQuery(
      [p.nome, shopName, p.lojista?.slug, p.descricao].filter(Boolean).join(" "),
    ),
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
  const [allProducts, setAllProducts] = useState([]);
  const [lojistas, setLojistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  useEffect(() => {
    if (window.location.hash === "#support-section") {
      requestAnimationFrame(() => {
        document
          .getElementById("support-section")
          ?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [produtos, lojistaList, categorias] = await Promise.all([
          listProdutosApi(),
          listLojistasApi(),
          listCategorias().catch(() => []),
        ]);

        const cards = (produtos || [])
          .filter((p) => isProdutoAtivo(p) && (p?.lojista?.slug || p?.lojista?.id))
          .map(mapProdutoCard)
          .filter((c) => c.shopSlug && c.productId);

        const nextSections = buildCategorySections(produtos, categorias);

        if (!cancelled) {
          setAllProducts(cards);
          setLojistas(lojistaList || []);
          setSections(nextSections);
        }
      } catch {
        if (!cancelled) {
          setSections([]);
          setAllProducts([]);
          setLojistas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  const searchResults = useMemo(() => {
    const q = normalizeQuery(activeQuery);
    if (!q) return null;

    const shops = (lojistas || []).filter((l) => {
      const hay = normalizeQuery(
        [l.nomeLoja, l.slug, l.descricao].filter(Boolean).join(" "),
      );
      return hay.includes(q);
    });

    const products = allProducts.filter((p) => p.searchText.includes(q));

    return { shops, products, q };
  }, [activeQuery, lojistas, allProducts]);

  function runSearch(e) {
    e?.preventDefault?.();
    const next = String(query || "").trim();
    setActiveQuery(next);
    if (next) {
      requestAnimationFrame(() => {
        document
          .getElementById("home-search-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function clearSearch() {
    setQuery("");
    setActiveQuery("");
  }

  const totalProducts = sections.reduce((n, s) => n + s.products.length, 0);
  const searching = Boolean(searchResults);

  return (
    <>
      <Banner imageSrc={BANNER_IMG} imageAlt="AYVY Logo">
        <div className="search-overlay-center" id="search-section">
          <h1 className="main-title">
            A plataforma de visibilidade para o seu negócio
          </h1>
          <form className="search-bar-clean" onSubmit={runSearch}>
            <input
              type="search"
              placeholder="Busque por lojas, produtos ou tendências..."
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="btn-search-black">
              <i className="fas fa-search" /> Pesquisar
            </button>
          </form>
          <p className="sub-text-hero">
            Conectando lojistas e clientes em um só lugar.
          </p>
        </div>
      </Banner>

      {!searching ? (
        <BrandSlider
          title="Empresas em destaque na plataforma:"
          brands={HOME_BRANDS}
        />
      ) : null}

      <main className="content-profiles">
        <div className="container">
          {searching ? (
            <section id="home-search-results" className="home-search-results">
              <div className="home-search-results-head">
                <h2 className="section-title-center">
                  Resultados para “{activeQuery}”
                </h2>
                <button
                  type="button"
                  className="home-search-clear"
                  onClick={clearSearch}
                >
                  Limpar busca
                </button>
              </div>

              <h3 className="home-category-title">Lojas</h3>
              {searchResults.shops.length === 0 ? (
                <p className="home-products-hint">Nenhuma loja encontrada.</p>
              ) : (
                <ul className="home-shop-results">
                  {searchResults.shops.map((loja) => {
                    const slug = normalizeSlug(loja.slug);
                    const logo =
                      resolveImageUrl(loja.logoUrl) ||
                      "https://i.pravatar.cc/80?u=" + encodeURIComponent(slug);
                    return (
                      <li key={loja.id}>
                        <Link
                          to={`/loja/${slug}`}
                          className="home-shop-result-card"
                        >
                          <img src={logo} alt="" />
                          <div>
                            <strong>{loja.nomeLoja}</strong>
                            <span>@{slug}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              <h3 className="home-category-title">Produtos</h3>
              {searchResults.products.length === 0 ? (
                <p className="home-products-hint">Nenhum produto encontrado.</p>
              ) : (
                <ProductGrid products={searchResults.products} />
              )}
            </section>
          ) : (
            <>
              <h2 className="section-title-center">Explore produtos em alta</h2>
              {loading ? (
                <p className="home-products-hint">Carregando produtos…</p>
              ) : null}
              {!loading && totalProducts === 0 ? (
                <p className="home-products-hint">
                  Nenhum produto ativo na API no momento. Cadastre produtos como
                  lojista (com categoria e status publicado) para vê-los aqui.
                </p>
              ) : null}

              {sections.map((section) => (
                <section key={section.id} className="home-category-block">
                  <h3 className="home-category-title">{section.title}</h3>
                  <ProductGrid products={section.products} />
                </section>
              ))}
            </>
          )}
        </div>
      </main>

      <Footer variant="support" />
    </>
  );
}
