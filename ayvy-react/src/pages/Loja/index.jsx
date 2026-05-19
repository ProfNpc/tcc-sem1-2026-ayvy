import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import FloatingChat from "../../components/FloatingChat";
import { SHOPS, normalizeSlugParam } from "../../utils/lojistaData";
import { enrichProduct, enrichShop } from "../../utils/productHelpers";
import "./style.css";

const FOLLOW_KEY = "ayvy.following.v1";

function readFollowing() {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Loja() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const shopRaw = SHOPS[slug];
  const shop = shopRaw ? enrichShop(shopRaw, slug) : null;

  const [chatOpen, setChatOpen] = useState(false);
  const [followingSlugs, setFollowingSlugs] = useState(() => readFollowing());

  if (!shop) {
    return (
      <div className="loja-not-found">
        <p>Loja não encontrada.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const isFollowing = followingSlugs.includes(slug);

  function toggleFollow() {
    setFollowingSlugs((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="page-loja-extra">
      <section className="loja-hero">
        <img src={shop.avatar} alt="" className="loja-hero-avatar" />
        <div className="loja-hero-content">
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
        <div className="loja-hero-actions">
          <button
            type="button"
            className={`loja-btn-follow ${isFollowing ? "is-following" : ""}`}
            onClick={toggleFollow}
            aria-pressed={isFollowing}
          >
              {isFollowing ? (
                <>
                  <i className="fas fa-check" aria-hidden /> Seguindo
                </>
              ) : (
                <>
                  <i className="fas fa-plus" aria-hidden /> Seguir
                </>
              )}
            </button>
            <button
              type="button"
              className="loja-btn-message"
              onClick={() => setChatOpen(true)}
            >
              <i className="fas fa-comment-dots" aria-hidden /> Enviar mensagem
          </button>
        </div>
      </section>

      <section className="loja-catalogo">
        <h2 className="loja-produtos-titulo">Recomendado para você</h2>
        <div className="loja-product-grid">
          {shop.products.map((p) => {
            const product = enrichProduct(p, shop);
            return (
              <Card
                key={p.id}
                variant="product"
                title={product.title}
                img={product.images[0]}
                price={product.price}
                rating={product.rating}
                soldCount={product.soldCount}
                discountPercent={product.discountPercent}
                productId={product.id}
                shopSlug={slug}
              />
            );
          })}
        </div>
      </section>

      <Footer />
      <FloatingChat
        shopName={shop.name}
        shopAvatar={shop.avatar}
        defaultOpen={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
