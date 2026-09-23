import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { resolveShopsMap } from "../../utils/lojistaData";
import "./style.css";

function recommendProducts(shops, cart, limit = 5) {
  const inCart = new Set(cart.map((l) => String(l.productId || "")));
  const all = [];
  for (const [slug, shop] of Object.entries(shops || {})) {
    for (const p of shop.products || []) {
      if (inCart.has(String(p.id))) continue;
      all.push({
        id: p.id,
        title: p.title || p.name,
        price: p.price,
        image: p.images?.[0] || p.href || p.img || "/assets/img/ayvy-media-a.png",
        slug,
        shopName: shop.name,
      });
    }
  }
  return all.slice(0, limit);
}

export default function Carrinho() {
  const navigate = useNavigate();
  const {
    cart,
    subtotal,
    freight,
    shippingOptions,
    total,
    freightValue,
    updateQuantity,
    removeLine,
    calculateFreight,
    selectFreightOption,
    startEditCep,
    formatBRL,
    lineSubtotal,
    formatCep,
    setDrawerOpen,
  } = useCart();

  const [cepInput, setCepInput] = useState(
    freight.cep ? formatCep(freight.cep) : "",
  );
  const [shopsMap, setShopsMap] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = await resolveShopsMap();
      if (!cancelled) setShopsMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recomenda = useMemo(
    () => recommendProducts(shopsMap, cart),
    [shopsMap, cart],
  );

  function handleCalcularFrete(e) {
    e.preventDefault();
    calculateFreight(cepInput);
  }

  function handleFinalizar() {
    if (cart.length === 0) return;
    setDrawerOpen(false);
    navigate("/checkout");
  }

  if (cart.length === 0) {
    return (
      <div className="ck-page">
        <div className="ck-empty">
          <h1>Seu carrinho</h1>
          <p>O carrinho está vazio.</p>
          <Link to="/" className="ck-btn ck-btn--primary">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ck-page">
      <div className="ck-cart-layout">
        <section className="ck-cart-main">
          <header className="ck-cart-head">
            <h1>Seu carrinho</h1>
            <p>
              Não está pronto para finalizar?{" "}
              <Link to="/">Continuar comprando</Link>
            </p>
          </header>

          <ul className="ck-cart-lines">
            {cart.map((item) => {
              const slug = item.shopSlug || item.slug;
              const pid = item.productId || item.apiId;
              const to = slug && pid ? `/loja/${slug}/p/${pid}` : null;
              return (
                <li key={item.id} className="ck-cart-line">
                  {to ? (
                    <Link to={to} className="ck-cart-line-media">
                      <img src={item.image} alt="" />
                    </Link>
                  ) : (
                    <img src={item.image} alt="" />
                  )}
                  <div className="ck-cart-line-info">
                    {to ? (
                      <Link to={to} className="ck-cart-line-title">
                        {item.name}
                      </Link>
                    ) : (
                      <strong>{item.name}</strong>
                    )}
                    {(item.color || item.size) && (
                      to ? (
                        <Link to={to} className="ck-cart-line-variant">
                          {[item.color, item.size].filter(Boolean).join(" · ")} · Alterar
                        </Link>
                      ) : (
                        <span>
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </span>
                      )
                    )}
                    {to && !(item.color || item.size) ? (
                      <Link to={to} className="ck-cart-line-variant">
                        Alterar opções
                      </Link>
                    ) : null}
                    <em>{formatBRL(lineSubtotal(item))}</em>
                  </div>
                  <div className="ck-cart-line-actions">
                    <div className="ck-qty">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                        −
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="ck-remove"
                      aria-label="Remover"
                      onClick={() => removeLine(item.id)}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="ck-summary">
          <h2>Resumo</h2>
          <ul className="ck-summary-items">
            {cart.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name}
                  {(item.quantity || 1) > 1 ? ` ×${item.quantity}` : ""}
                </span>
                <strong>{formatBRL(lineSubtotal(item))}</strong>
              </li>
            ))}
          </ul>

          <div className="ck-summary-row">
            <span>Subtotal</span>
            <strong>{formatBRL(subtotal)}</strong>
          </div>

          {freight.cepConfirmed && (
            <div className="ck-summary-row">
              <span>Frete</span>
              <strong>
                {freightValue === 0 ? "Grátis" : formatBRL(freightValue)}
              </strong>
            </div>
          )}

          <div className="ck-summary-total">
            <span>Total</span>
            <strong>{formatBRL(freight.cepConfirmed ? total : subtotal)}</strong>
          </div>

          <button type="button" className="ck-btn ck-btn--primary ck-btn--block" onClick={handleFinalizar}>
            Finalizar compra
          </button>
          <Link to="/" className="ck-link-more">
            Escolher mais produtos
          </Link>

          <section className="ck-freight-box">
            <h3>Calcular frete</h3>
            {freight.editingCep || !freight.cepConfirmed ? (
              <form className="ck-cep-form" onSubmit={handleCalcularFrete}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="CEP"
                  maxLength={9}
                  value={cepInput}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setCepInput(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
                  }}
                />
                <button type="submit" disabled={freight.loading}>
                  {freight.loading ? "..." : "Calcular"}
                </button>
              </form>
            ) : (
              <div className="ck-cep-ok">
                <p>
                  CEP <strong>{formatCep(freight.cep)}</strong>
                  {freight.city ? ` — ${freight.city}/${freight.uf}` : ""}
                </p>
                <button type="button" onClick={startEditCep}>
                  Alterar CEP
                </button>
              </div>
            )}
            {freight.error ? <p className="ck-error">{freight.error}</p> : null}
            {freight.cepConfirmed && shippingOptions.length > 0 && (
              <ul className="ck-ship-opts">
                {shippingOptions.map((opt) => (
                  <li key={opt.id}>
                    <label>
                      <input
                        type="radio"
                        name="cart-ship"
                        checked={freight.selectedOptionId === opt.id}
                        onChange={() => selectFreightOption(opt.id)}
                      />
                      <span>
                        <strong>{opt.name}</strong>
                        <small>{opt.days}</small>
                      </span>
                      <em>{opt.priceLabel}</em>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {recomenda.length > 0 && (
        <section className="ck-reco">
          <h2>Escolha mais produtos</h2>
          <div className="ck-reco-row">
            {recomenda.map((p) => (
              <article key={p.id} className="ck-reco-card">
                <Link to={`/loja/${p.slug}/p/${p.id}`}>
                  <img src={p.image} alt="" />
                  <strong>{p.title}</strong>
                  <span>{p.price}</span>
                </Link>
                <Link to={`/loja/${p.slug}/p/${p.id}`} className="ck-btn ck-btn--ghost ck-btn--block">
                  Ver produto
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="ck-trust">
        <div>
          <h3>Métodos de pagamento</h3>
          <div className="ck-pay-badges">
            <span>Pix</span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Elo</span>
            <span>Amex</span>
          </div>
        </div>
        <div>
          <h3>Compra segura</h3>
          <p className="ck-trust-text">
            <i className="fas fa-shield-alt" aria-hidden /> Ambiente protegido · dados criptografados
          </p>
        </div>
      </section>
    </div>
  );
}
