import { Link } from "react-router-dom";
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
  linkLabel = "Ver Loja",
}) {
  if (variant === "product") {
    const to = `/loja/${shopSlug}/p/${productId}`;
    return (
      <div className="card-insta">
        <div className="card-header">
          <span>{title}</span>
        </div>
        <img src={img} className="card-img" alt="" />
        {price ? <p className="card-price-line">{price}</p> : null}
        <Link className="btn-visit" to={to}>
          {linkLabel}
        </Link>
      </div>
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
