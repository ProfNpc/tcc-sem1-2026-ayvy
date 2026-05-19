import { Link } from "react-router-dom";
import { formatSoldLabel } from "../../utils/productHelpers";
import "./style.css";

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
  linkLabel = "Ver Loja",
}) {
  if (variant === "product") {
    const to = `/loja/${shopSlug}/p/${productId}`;
    const showDiscount = discountPercent > 0;

    return (
      <Link to={to} className="card-product-shopee">
        <div className="card-product-shopee__img-wrap">
          <img src={img} alt={title} loading="lazy" />
        </div>
        <div className="card-product-shopee__body">
          <h3 className="card-product-shopee__title">{title}</h3>
          <div className="card-product-shopee__price-row">
            <span className="card-product-shopee__price">{price}</span>
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
