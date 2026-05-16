import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { findProduct, normalizeSlugParam } from "../../utils/lojistaData";
import "./style.css";

export default function Produto() {
  const { slug: raw, productId } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const found = findProduct(slug, productId || "");
  const { addItem, toggle } = useCart();
  const { loggedIn } = useAuth();

  if (!found) {
    return (
      <div className="produto-not-found">
        <p>Produto não encontrado.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const { shop, product } = found;
  const img = product.images[0];

  function handleAddToCart() {
    if (!loggedIn) {
      alert("Faça login para adicionar ao carrinho.");
      return;
    }
    addItem(product.title, img);
    toggle();
  }

  return (
    <div className="page-produto-extra">
      <div className="produto-detalhe">
        <div>
          <img src={img} alt="" />
        </div>
        <div>
          <p className="produto-loja-link">
            <Link to={`/loja/${slug}`}>{shop.name}</Link>
          </p>
          <h1 className="produto-titulo">{product.title}</h1>
          <p className="produto-preco">{product.price}</p>
          <p>{product.description}</p>
          <div className="produto-acoes">
            <button type="button" className="btn-round purple" onClick={handleAddToCart}>
              Adicionar ao carrinho
            </button>
            <Link className="btn-round" to={`/loja/${slug}`}>
              Voltar à loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
