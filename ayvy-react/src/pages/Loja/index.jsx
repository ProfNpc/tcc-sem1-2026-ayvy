import { Link, useParams } from "react-router-dom";
import Card from "../../components/Card";
import { SHOPS, normalizeSlugParam } from "../../utils/lojistaData";
import "./style.css";

export default function Loja() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const shop = SHOPS[slug];

  if (!shop) {
    return (
      <div className="loja-not-found">
        <p>Loja não encontrada.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="page-loja-extra">
      <section className="loja-hero">
        <img src={shop.avatar} alt="" />
        <div>
          <h1 className="loja-hero-title">{shop.name}</h1>
          <p className="loja-hero-handle">{shop.handle}</p>
          <p className="loja-hero-bio">{shop.bio}</p>
          <div className="loja-stats">
            {shop.stats.map((s) => (
              <span key={s.label}>
                <strong>{s.value}</strong> {s.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <h2 className="loja-produtos-titulo">Produtos</h2>
      <main className="content-profiles">
        <div className="container">
          <div className="profile-grid">
            {shop.products.map((p) => (
              <Card
                key={p.id}
                variant="product"
                title={p.title}
                img={p.images[0]}
                price={p.price}
                productId={p.id}
                shopSlug={slug}
                linkLabel="Ver produto"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
