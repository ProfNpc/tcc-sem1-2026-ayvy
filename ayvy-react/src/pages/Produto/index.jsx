import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import FloatingChat from "../../components/FloatingChat";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { findProduct, normalizeSlugParam } from "../../utils/lojistaData";
import { enrichProduct, enrichShop, renderStars } from "../../utils/productHelpers";
import "./style.css";

const FAV_KEY = "ayvy.favorites.v1";

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function StarRating({ rating }) {
  const stars = renderStars(rating);
  return (
    <span className="produto-stars" aria-label={`${rating} de 5 estrelas`}>
      {stars.map((type, i) => (
        <i
          key={i}
          className={
            type === "full"
              ? "fas fa-star"
              : type === "half"
                ? "fas fa-star-half-alt"
                : "far fa-star"
          }
        />
      ))}
    </span>
  );
}

export default function Produto() {
  const { slug: raw, productId } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const rawFound = findProduct(slug, productId || "");

  const found = useMemo(() => {
    if (!rawFound) return null;
    return {
      shop: enrichShop(rawFound.shop, slug),
      product: enrichProduct(rawFound.product, rawFound.shop),
    };
  }, [rawFound, slug]);

  if (!found) {
    return (
      <div className="produto-not-found">
        <p>Produto não encontrado.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <ProdutoDetail
      key={`${slug}-${found.product.id}`}
      slug={slug}
      shop={found.shop}
      product={found.product}
    />
  );
}

function ProdutoDetail({ slug, shop, product }) {
  const { addItem, toggle } = useCart();
  const { loggedIn } = useAuth();

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [favorites, setFavorites] = useState(() => readFavorites());
  const [chatOpen, setChatOpen] = useState(false);

  const favKey = `${slug}:${product.id}`;
  const isFavorite = favorites.includes(favKey);

  const filteredReviews =
    reviewFilter === "all"
      ? product.reviews
      : product.reviews.filter((r) => r.rating === Number(reviewFilter));

  const reviewCounts = {
    all: product.reviews.length,
    5: product.reviews.filter((r) => r.rating === 5).length,
    4: product.reviews.filter((r) => r.rating === 4).length,
    3: product.reviews.filter((r) => r.rating === 3).length,
    2: product.reviews.filter((r) => r.rating === 2).length,
    1: product.reviews.filter((r) => r.rating === 1).length,
  };

  function toggleFavorite() {
    setFavorites((prev) => {
      const next = prev.includes(favKey)
        ? prev.filter((k) => k !== favKey)
        : [...prev, favKey];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }

  const imageCount = product.images.length;

  function goPrevImage() {
    setActiveImage((i) => (i <= 0 ? imageCount - 1 : i - 1));
  }

  function goNextImage() {
    setActiveImage((i) => (i >= imageCount - 1 ? 0 : i + 1));
  }

  function handleAddToCart() {
    if (!loggedIn) {
      alert("Faça login para adicionar ao carrinho.");
      return;
    }
    if (!color || !size) {
      alert("Selecione a cor e o tamanho.");
      return;
    }
    if (product.stock === "indisponivel") {
      alert("Produto sem estoque no momento.");
      return;
    }
    const img = product.images[activeImage] || product.images[0];
    addItem({
      name: product.title,
      image: img,
      price: product.price,
      color,
      size,
      quantity,
      productId: product.id,
      shopSlug: slug,
    });
    toggle();
  }

  return (
    <div className="page-produto-shopee">
      <div className="produto-layout">
        <div className="produto-gallery-col">
          <div className="produto-gallery-main">
            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  className="produto-gallery-nav produto-gallery-nav--prev"
                  onClick={goPrevImage}
                  aria-label="Foto anterior"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                <button
                  type="button"
                  className="produto-gallery-nav produto-gallery-nav--next"
                  onClick={goNextImage}
                  aria-label="Próxima foto"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </>
            )}
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.title}
            />
          </div>
          {product.images.length > 1 && (
            <div className="produto-gallery-thumbs">
              {product.images.map((src, idx) => (
                <button
                  key={src}
                  type="button"
                  className={idx === activeImage ? "is-active" : ""}
                  onClick={() => setActiveImage(idx)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`produto-favorito-btn ${isFavorite ? "is-active" : ""}`}
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
          >
            <i className={isFavorite ? "fas fa-heart" : "far fa-heart"} />
            <span>Favoritar ({product.favoriteCount + (isFavorite ? 1 : 0)})</span>
          </button>
        </div>

        <div className="produto-buy-col">
          <h1 className="produto-titulo">{product.title}</h1>

          <div className="produto-rating-row">
            <StarRating rating={product.rating} />
            <span className="produto-rating-num">{product.rating.toFixed(1)}</span>
            <span className="produto-rating-sep">|</span>
            <a href="#avaliacoes-produto" className="produto-rating-link">
              {product.reviewCount} Avaliação{product.reviewCount !== 1 ? "ões" : ""}
            </a>
            <span className="produto-rating-sep">|</span>
            <span className="produto-vendidos">{product.soldCount} Vendido(s)</span>
          </div>

          <div className="produto-preco-box">
            <p className="produto-preco-pix">
              <strong>{product.pricePix}</strong>
              <span className="produto-pix-tag">no Pix</span>
            </p>
            <p className="produto-preco-outros">
              Ou {product.priceOther} com outros métodos de pagamento
            </p>
          </div>

          <div className="produto-option-block">
            <span className="produto-option-label">Cor</span>
            <div className="produto-option-grid">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`produto-chip ${color === c ? "is-selected" : ""}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="produto-option-block">
            <span className="produto-option-label">Tamanho</span>
            <div className="produto-option-row">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`produto-chip ${size === s ? "is-selected" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="produto-option-block produto-qty-block">
            <span className="produto-option-label">Quantidade</span>
            <div className="produto-qty-stepper">
              <button
                type="button"
                aria-label="Diminuir"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setQuantity(Number.isNaN(v) ? 1 : Math.min(99, Math.max(1, v)));
                }}
              />
              <button
                type="button"
                aria-label="Aumentar"
                disabled={quantity >= 99}
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              >
                +
              </button>
            </div>
            <span className="produto-estoque-hint">{product.stockLabel}</span>
          </div>

          <button
            type="button"
            className="produto-btn-carrinho"
            onClick={handleAddToCart}
            disabled={product.stock === "indisponivel"}
          >
            <i className="fas fa-cart-plus" /> Adicionar ao carrinho
          </button>
        </div>
      </div>

      <section className="produto-section-card produto-loja-card">
        <img src={shop.avatar} alt="" className="produto-loja-avatar" />
        <div className="produto-loja-info">
          <p className="produto-loja-handle">{shop.handle}</p>
          <p className="produto-loja-nome">{shop.name}</p>
          <div className="produto-loja-stats">
            <span>
              <strong>{shop.reviewCount}</strong>
              <small>Avaliações</small>
            </span>
            <span>
              <strong>{shop.productCount}</strong>
              <small>Produtos</small>
            </span>
            <span>
              <strong>{shop.chatResponseRate}</strong>
              <small>Taxa resposta chat</small>
            </span>
            <span>
              <strong>{shop.monthsOnAyvy} meses</strong>
              <small>Na AYVY</small>
            </span>
            <span>
              <strong>{shop.followers}</strong>
              <small>Seguidores</small>
            </span>
          </div>
        </div>
        <div className="produto-loja-actions">
          <button type="button" className="produto-btn-chat" onClick={() => setChatOpen(true)}>
            <i className="fas fa-comment-dots" /> Conversar agora
          </button>
          <Link className="produto-btn-loja" to={`/loja/${slug}`}>
            <i className="fas fa-store" /> Ver página da loja
          </Link>
        </div>
      </section>

      <section className="produto-section-card">
        <h2>Detalhes do produto</h2>
        <dl className="produto-detalhes-lista">
          <div>
            <dt>Categoria</dt>
            <dd>
              {product.categoryPath.map((part, i) => (
                <span key={part}>
                  {i > 0 && " › "}
                  <span className="produto-cat-link">{part}</span>
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Estoque</dt>
            <dd>{product.stockLabel}</dd>
          </div>
          <div>
            <dt>País de origem</dt>
            <dd>{product.originCountry}</dd>
          </div>
          <div>
            <dt>Envio de</dt>
            <dd>{product.shipsFrom}</dd>
          </div>
        </dl>
      </section>

      <section className="produto-section-card">
        <h2>Descrição do produto</h2>
        <p className="produto-descricao-texto">{product.description}</p>
      </section>

      <section className="produto-section-card" id="avaliacoes-produto">
        <h2>Avaliações do produto</h2>
        <div className="produto-reviews-header">
          <div className="produto-reviews-score">
            <span className="produto-reviews-big">{product.rating} de 5</span>
            <StarRating rating={product.rating} />
          </div>
          <div className="produto-reviews-filters">
            <button
              type="button"
              className={reviewFilter === "all" ? "is-active" : ""}
              onClick={() => setReviewFilter("all")}
            >
              Tudo ({reviewCounts.all})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                className={reviewFilter === String(s) ? "is-active" : ""}
                onClick={() => setReviewFilter(String(s))}
              >
                {s} Estrela ({reviewCounts[s]})
              </button>
            ))}
          </div>
        </div>

        <div className="produto-reviews-list">
          {filteredReviews.length === 0 ? (
            <p className="produto-reviews-empty">Nenhuma avaliação neste filtro.</p>
          ) : (
            filteredReviews.map((rev) => (
              <article key={rev.id} className="produto-review-item">
                <img src={rev.avatar} alt="" />
                <div>
                  <p className="produto-review-user">{rev.user}</p>
                  <StarRating rating={rev.rating} />
                  <p className="produto-review-meta">
                    {rev.date}
                    {rev.variation ? ` | Variação: ${rev.variation}` : ""}
                  </p>
                  {rev.attributes?.map((a) => (
                    <p key={a.label} className="produto-review-attr">
                      <strong>{a.label}:</strong> {a.value}
                    </p>
                  ))}
                  {rev.text && <p className="produto-review-text">{rev.text}</p>}
                </div>
              </article>
            ))
          )}
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
