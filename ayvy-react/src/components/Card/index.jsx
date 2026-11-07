/**
 * Card de produto (variant="product") e card de loja (padrão).
 * Produto: foto, nome, preço com desconto (originalPrice riscado + selo -X%), nota e vendidos.
 * ownerMode=true mostra lápis (editar) e lixeira para o dono da loja.
 * Se a foto não existir no servidor, troca pela imagem padrão (usarImagemReserva).
 * Usado em: pages/Home, pages/Loja.
 */
import { Link } from "react-router-dom";
import { formatSoldLabel } from "../../utils/productHelpers";
import "./style.css";

const IMAGEM_RESERVA = "/assets/img/ayvy-media-a.png";

/** Se a foto não existir no servidor, mostra a imagem padrão da AYVY em vez do ícone quebrado. */
function usarImagemReserva(e) {
  if (e.currentTarget.dataset.reserva) return;
  e.currentTarget.dataset.reserva = "1";
  e.currentTarget.src = IMAGEM_RESERVA;
}

/**
 * Card reutilizável — variantes alinhadas ao legado (.card-insta).
 */
export default function Card({
  variant,
  slug,
  user,
  avatar,
  img,
  title,
  price,
  productId,
  shopSlug,
  rating,
  soldCount,
  discountPercent = 0,
  originalPrice,
  linkLabel = "Ver Loja",
  ownerMode = false,
  onDelete,
  editTo,
}) {
  if (variant === "product") {
    const to = `/loja/${shopSlug}/p/${productId}`;
    const showDiscount = discountPercent > 0;

    if (ownerMode) {
      return (
        <div className="card-product-shopee card-product-shopee--owner">
          <Link to={to} className="card-product-shopee__link">
            <div className="card-product-shopee__img-wrap">
              <img src={img || IMAGEM_RESERVA} alt={title} loading="lazy" onError={usarImagemReserva} />
            </div>
            <div className="card-product-shopee__body">
              <h3 className="card-product-shopee__title">{title}</h3>
              <div className="card-product-shopee__price-row">
                <span className="card-product-shopee__price">{price}</span>
                {showDiscount && originalPrice ? (
                  <s className="card-product-shopee__old-price">{originalPrice}</s>
                ) : null}
                {showDiscount && (
                  <span className="card-product-shopee__discount">-{discountPercent}%</span>
                )}
              </div>
              <div className="card-product-shopee__meta">
                <span className="card-product-shopee__rating">
                  <i className="fas fa-star" aria-hidden />
                  {Number(rating).toFixed(1)}
                </span>
                <span className="card-product-shopee__sold">{formatSoldLabel(soldCount)}</span>
              </div>
            </div>
          </Link>
          <div className="card-product-shopee__owner-actions">
            {editTo ? (
              <Link
                to={editTo}
                className="card-product-shopee__owner-btn card-product-shopee__owner-btn--edit"
                aria-label={`Editar ${title}`}
                title="Editar produto"
              >
                <i className="fas fa-pen" aria-hidden />
              </Link>
            ) : null}
            <button
              type="button"
              className="card-product-shopee__owner-btn card-product-shopee__delete"
              aria-label={`Excluir ${title}`}
              title="Remover da vitrine"
              onClick={onDelete}
            >
              <i className="fas fa-trash-alt" aria-hidden />
            </button>
          </div>
        </div>
      );
    }

    return (
      <Link to={to} className="card-product-shopee">
        <div className="card-product-shopee__img-wrap">
          <img src={img || IMAGEM_RESERVA} alt={title} loading="lazy" onError={usarImagemReserva} />
        </div>
        <div className="card-product-shopee__body">
          <h3 className="card-product-shopee__title">{title}</h3>
          <div className="card-product-shopee__price-row">
            <span className="card-product-shopee__price">{price}</span>
            {showDiscount && originalPrice ? (
              <s className="card-product-shopee__old-price">{originalPrice}</s>
            ) : null}
            {showDiscount && (
              <span className="card-product-shopee__discount">-{discountPercent}%</span>
            )}
          </div>
          <div className="card-product-shopee__meta">
            <span className="card-product-shopee__rating">
              <i className="fas fa-star" aria-hidden />
              {Number(rating).toFixed(1)}
            </span>
            <span className="card-product-shopee__sold">{formatSoldLabel(soldCount)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card-insta">
      <div className="card-header">
        <img src={avatar} className="avatar-mini" alt="" />
        <span>{user}</span>
      </div>
      <img src={img} className="card-img" alt="" />
      <Link className="btn-visit" to={`/loja/${slug}`}>
        {linkLabel}
      </Link>
    </div>
  );
}
