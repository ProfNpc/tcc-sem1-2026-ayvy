import { useState } from "react";
import { useCart } from "../../context/CartContext";
import "./style.css";

export default function CartDrawer() {
  const {
    cart,
    drawerOpen,
    freightText,
    toggle,
    calculateFreight,
    finalizePurchase,
  } = useCart();
  const [cep, setCep] = useState("");

  return (
    <>
      <div className={`cart-drawer ${drawerOpen ? "open" : ""}`} id="cartDrawer">
        <div className="cart-header">
          <span>Carrinho de Compras</span>
          <i className="fas fa-times" onClick={toggle} role="presentation" />
        </div>
        <div className="cart-items" id="cartItems">
          {cart.map((item, i) => (
            <div className="cart-item" key={`${item.name}-${i}`}>
              <img src={item.image} alt={item.name} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <input
            type="text"
            id="cepInput"
            placeholder="Digite seu CEP"
            maxLength={8}
            value={cep}
            onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
          />
          <button type="button" onClick={() => calculateFreight(cep)}>
            Calcular Frete
          </button>
          <p id="freightResult">{freightText}</p>
          <button type="button" className="btn-finalize" onClick={finalizePurchase}>
            Finalizar Compra
          </button>
        </div>
      </div>

      <div
        className={`cart-overlay ${drawerOpen ? "active" : ""}`}
        id="cartOverlay"
        onClick={toggle}
        role="presentation"
      />
    </>
  );
}
