import Banner from "../../components/Banner";
import BrandSlider from "../../components/BrandSlider";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import { HOME_BRANDS, HOME_PROFILE_CARDS } from "../../utils/homeContent";
import "./style.css";

const BANNER_IMG = "/assets/img/img-curta-ayvy.jpeg";

export default function Home() {
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

      <BrandSlider title="Empresas em destaque na plataforma:" brands={HOME_BRANDS} />

      <main className="content-profiles">
        <div className="container">
          <h2 className="section-title-center">Explore Perfis em Alta</h2>
          <div className="profile-grid">
            {HOME_PROFILE_CARDS.map((c) => (
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
