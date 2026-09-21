import { useEffect, useState } from "react";
import Banner from "../../components/Banner";
import BrandSlider from "../../components/BrandSlider";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import { HOME_BRANDS, HOME_PROFILE_CARDS } from "../../utils/homeContent";
import { resolveShopsMap } from "../../utils/lojistaData";
import "./style.css";

const BANNER_IMG = "/assets/img/img-curta-ayvy.jpeg";

export default function Home() {
  const [profileCards, setProfileCards] = useState(HOME_PROFILE_CARDS);
  const [brands, setBrands] = useState(HOME_BRANDS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const shops = await resolveShopsMap();
        const entries = Object.entries(shops || {});
        if (!entries.length) return;

        const fromApi = entries.slice(0, 12).map(([slug, shop]) => ({
          slug,
          user: shop.handle?.replace(/^@/, "") || slug,
          avatar: shop.avatar,
          img:
            shop.cover ||
            shop.products?.[0]?.href ||
            shop.products?.[0]?.img ||
            shop.avatar,
        }));

        const brandNames = entries
          .map(([, shop]) => String(shop.name || "").toUpperCase())
          .filter(Boolean);

        if (!cancelled) {
          if (fromApi.length) setProfileCards(fromApi);
          if (brandNames.length) setBrands(brandNames);
        }
      } catch {
        /* mantém conteúdo mock da home */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <h2 className="section-title-center">Explore Perfis em Alta</h2>
          <div className="profile-grid">
            {profileCards.map((c) => (
              <Card
                key={c.slug}
                variant="profile"
                slug={c.slug}
                user={c.user}
                avatar={c.avatar}
                img={c.img}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer variant="home" />
    </>
  );
}
