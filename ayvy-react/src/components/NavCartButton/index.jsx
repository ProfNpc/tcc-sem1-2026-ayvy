import { useCart } from "../../context/CartContext";

/**
 * Botão padrão do carrinho AYVY — usar em qualquer header (desktop/mobile/admin).
 */
export default function NavCartButton({ id = "navCartIcon", className = "" }) {
  const { cartCount, toggle } = useCart();

  return (
    <div
      className={`nav-cart-icon ${className}`.trim()}
      id={id}
      onClick={toggle}
      title="Carrinho"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <i className="fas fa-shopping-cart" aria-hidden />
      <span className="nav-cart-label">Carrinho</span>
      <span className="nav-cart-count" id={id === "navCartIconMobile" ? "cartCountMobile" : "cartCount"}>
        {cartCount}
      </span>
    </div>
  );
}
