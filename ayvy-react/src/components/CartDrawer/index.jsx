import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatCep } from "../../utils/cartHelpers";
import "./style.css";

function productPath(item) {
  const slug = item.shopSlug || item.slug;
  const pid = item.productId || item.apiId;
  if (!slug || !pid) return null;
  return `/loja/${slug}/p/${pid}`;
}

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    drawerOpen,
    freight,
    shippingOptions,
    subtotal,
    total,
    toggle,
    calculateFreight,
    selectFreightOption,
    startEditCep,
    updateQuantity,
    removeLine,
    formatBRL,
    lineSubtotal,
    setDrawerOpen,
  } = useCart();

  const [cepInput, setCepInput] = useState("");

  function handleAlterCep() {
    startEditCep();
    setCepInput(freight.cep ? formatCep(freight.cep) : "");
  }

  function handleCalculateCep(e) {
    e.preventDefault();
    calculateFreight(cepInput);
  }

  function handleIniciarCompra() {
    if (cart.length === 0) {
      alert("O carrinho de compras está vazio!");
      return;
    }
    setDrawerOpen(false);
    navigate("/carrinho");
  }

  function goToProduct(item) {
    const to = productPath(item);
    if (!to) return;
    setDrawerOpen(false);
    navigate(to);
  }

  return (
    <>
      <div className={`cart-drawer ${drawerOpen ? "open" : ""}`} id="cartDrawer">
        <div className="cart-header">
          <span>Carrinho de Compras</span>
          <button type="button" className="cart-close" onClick={toggle} aria-label="Fechar">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="cart-items" id="cartItems">
          {cart.length === 0 ? (
            <p className="cart-empty">O carrinho de compras está vazio!</p>
          ) : (
            cart.map((item) => {
              const to = productPath(item);
              return (
                <article key={item.id} className="cart-line">
                  {to ? (
                    <button
                      type="button"
                      className="cart-line-img-btn"
                      onClick={() => goToProduct(item)}
                      aria-label={`Abrir ${item.name}`}
                    >
                      <img src={item.image} alt="" className="cart-line-img" />
                    </button>
                  ) : (
                    <img src={item.image} alt="" className="cart-line-img" />
                  )}
                  <div className="cart-line-body">
                    <div className="cart-line-top">
                      {to ? (
                        <button
                          type="button"
                          className="cart-line-name cart-line-name--link"
                          onClick={() => goToProduct(item)}
                        >
                          {item.name}
                        </button>
                      ) : (
                        <h3 className="cart-line-name">{item.name}</h3>
                      )}
                      <button
                        type="button"
                        className="cart-line-remove"
                        onClick={() => removeLine(item.id)}
                        aria-label="Remover"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                    {(item.color || item.size) &&
                      (to ? (
                        <button
                          type="button"
                          className="cart-line-variant cart-line-variant--link"
                          onClick={() => goToProduct(item)}
                        >
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                          <span> · Alterar</span>
                        </button>
                      ) : (
                        <p className="cart-line-variant">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      ))}
                    {to && !(item.color || item.size) ? (
                      <button
                        type="button"
                        className="cart-line-variant cart-line-variant--link"
                        onClick={() => goToProduct(item)}
                      >
                        Alterar opções
                      </button>
                    ) : null}
                    <div className="cart-line-bottom">
                      <div className="cart-line-qty">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          −
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-line-price">{formatBRL(lineSubtotal(item))}</span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <footer className="cart-footer">
            <div className="cart-subtotal-row">
              <span>Subtotal (sem frete)</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>

            <section className="cart-freight-section">
              <h4 className="cart-freight-title">
                <i className="fas fa-truck" aria-hidden /> Meios de envio
              </h4>

              {freight.editingCep ? (
                <form className="cart-cep-form" onSubmit={handleCalculateCep}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Seu CEP"
                    maxLength={9}
                    value={cepInput}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setCepInput(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
                    }}
                  />
                  <button type="submit" className="cart-btn-cep" disabled={freight.loading}>
                    {freight.loading ? "..." : "CALCULAR"}
                  </button>
                </form>
              ) : (
                <div className="cart-cep-confirmed">
                  <p>
                    Entregas para o CEP: <strong>{formatCep(freight.cep)}</strong>
                    {freight.city ? ` — ${freight.city}/${freight.uf}` : ""}
                  </p>
                  <button type="button" className="cart-btn-alterar-cep" onClick={handleAlterCep}>
                    ALTERAR CEP
                  </button>
                </div>
              )}

              {freight.error && <p className="cart-freight-error">{freight.error}</p>}

              {!freight.editingCep &&
                freight.cepConfirmed &&
                shippingOptions.length > 0 && (
                  <div className="cart-shipping-options">
                    <p className="cart-shipping-label">Envio a domicílio</p>
                    <ul>
                      {shippingOptions.map((opt) => (
                        <li key={opt.id}>
                          <label className="cart-shipping-option">
                            <input
                              type="radio"
                              name="shipping"
                              checked={freight.selectedOptionId === opt.id}
                              onChange={() => selectFreightOption(opt.id)}
                            />
                            <span className="cart-shipping-option-body">
                              <span className="cart-shipping-option-row">
                                <strong>{opt.name}</strong>
                                <span className="cart-shipping-option-price">
                                  {opt.priceLabel}
                                </span>
                              </span>
                              <small>{opt.days}</small>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>

            <div className="cart-total-block">
              <div className="cart-total-row">
                <span>Total</span>
                <strong>{formatBRL(total)}</strong>
              </div>
              {subtotal >= 100 && (
                <p className="cart-installments">
                  Ou até 4x de {formatBRL(total / 4)} sem juros
                </p>
              )}
            </div>

            <button type="button" className="cart-btn-checkout" onClick={handleIniciarCompra}>
              INICIAR COMPRA
            </button>
          </footer>
        )}
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
