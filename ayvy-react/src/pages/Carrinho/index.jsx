/**
 * Carrinho (/carrinho). Também importa o carrinho do app: /carrinho?itens=produtoId:quantidade,...
 * (ver utils/cartImport.js). Itens importados de produto com opções pedem cor/tamanho antes de finalizar.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { listProdutosApi } from "../../services/shopApi";
import { linhaPrecisaOpcoes, montarImportacao, parseItensParam } from "../../utils/cartImport";
import { resolveShopsMap } from "../../utils/lojistaData";
import "./style.css";

function ImportNotice({ importacao, onClose }) {
  if (!importacao) return null;
  if (importacao.status === "carregando") {
    return (
      <div className="ck-import ck-import--loading" role="status">
        <span className="ck-import__spinner" aria-hidden /> Trazendo os itens do app para o carrinho…
      </div>
    );
  }
  const temAvisos = importacao.avisos.length > 0;
  const tipo = importacao.status === "erro" ? "erro" : temAvisos ? "aviso" : "ok";
  return (
    <div className={`ck-import ck-import--${tipo}`} role="status">
      <div className="ck-import__body">
        {importacao.titulo ? <strong>{importacao.titulo}</strong> : null}
        {temAvisos ? (
          <ul>
            {importacao.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" className="ck-import__close" onClick={onClose} aria-label="Fechar aviso">
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

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
  const [searchParams] = useSearchParams();
  const itensParam = searchParams.get("itens");
  const importadoRef = useRef(null);
  const [importacao, setImportacao] = useState(null);
  const {
    cart,
    importLines,
    updateLineOptions,
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

  useEffect(() => {
    if (itensParam == null || importadoRef.current === itensParam) return;
    importadoRef.current = itensParam;

    const { itens, invalidos } = parseItensParam(itensParam);
    const avisosFormato =
      invalidos > 0
        ? [
            `${invalidos} ${invalidos === 1 ? "item do link estava" : "itens do link estavam"} em formato inválido e ${invalidos === 1 ? "foi ignorado" : "foram ignorados"}.`,
          ]
        : [];

    if (itens.length === 0) {
      setTimeout(() => {
        setImportacao({
          status: "pronto",
          titulo: "Nenhum item do app pôde ser adicionado.",
          avisos: avisosFormato,
        });
        navigate("/carrinho", { replace: true });
      }, 0);
      return;
    }

    setTimeout(() => setImportacao({ status: "carregando", avisos: [] }), 0);
    (async () => {
      try {
        const produtos = await listProdutosApi();
        const { linhas, avisos, adicionados } = montarImportacao(itens, produtos, cart);
        if (linhas.length > 0) importLines(linhas);
        const precisaOpcoes = linhas.some(linhaPrecisaOpcoes);
        setImportacao({
          status: "pronto",
          titulo:
            adicionados > 0
              ? `${adicionados} ${adicionados === 1 ? "item do app foi adicionado" : "itens do app foram adicionados"} ao seu carrinho.${precisaOpcoes ? " Escolha cor e tamanho dos itens marcados antes de finalizar." : ""}`
              : "Nenhum item do app pôde ser adicionado.",
          avisos: [...avisosFormato, ...avisos],
        });
        navigate("/carrinho", { replace: true });
      } catch (e) {
        importadoRef.current = null;
        setImportacao({
          status: "erro",
          titulo: "Não foi possível trazer os itens do app agora.",
          avisos: [e?.message || "Verifique sua conexão e atualize a página para tentar de novo."],
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- importa uma vez por link
  }, [itensParam]);

  const recomenda = useMemo(
    () => recommendProducts(shopsMap, cart),
    [shopsMap, cart],
  );

  const linhasPendentes = cart.filter(linhaPrecisaOpcoes);

  function handleCalcularFrete(e) {
    e.preventDefault();
    calculateFreight(cepInput);
  }

  function handleFinalizar() {
    if (cart.length === 0 || linhasPendentes.length > 0) return;
    setDrawerOpen(false);
    navigate("/checkout");
  }

  const aviso = <ImportNotice importacao={importacao} onClose={() => setImportacao(null)} />;

  if (cart.length === 0) {
    return (
      <div className="ck-page">
        {aviso}
        {importacao?.status === "carregando" ? null : (
          <div className="ck-empty">
            <h1>Seu carrinho</h1>
            <p>O carrinho está vazio.</p>
            <Link to="/" className="ck-btn ck-btn--primary">
              Continuar comprando
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ck-page">
      {aviso}
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
              const pendente = linhaPrecisaOpcoes(item);
              return (
                <li key={item.id} className={`ck-cart-line${pendente ? " ck-cart-line--pending" : ""}`}>
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
                    {pendente ? (
                      <div className="ck-line-options">
                        <span className="ck-line-options__label">
                          <i className="fas fa-exclamation-circle" aria-hidden /> Escolha as opções
                        </span>
                        {item.colors?.length > 0 ? (
                          <select
                            aria-label={`Cor de ${item.name}`}
                            value={item.color || ""}
                            onChange={(e) => updateLineOptions(item.id, { color: e.target.value || null })}
                          >
                            <option value="">Cor…</option>
                            {item.colors.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        {item.sizes?.length > 0 ? (
                          <select
                            aria-label={`Tamanho de ${item.name}`}
                            value={item.size || ""}
                            onChange={(e) => updateLineOptions(item.id, { size: e.target.value || null })}
                          >
                            <option value="">Tamanho…</option>
                            {item.sizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    ) : (item.color || item.size) && (
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
                    {to && !pendente && !(item.color || item.size) ? (
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

          <button
            type="button"
            className="ck-btn ck-btn--primary ck-btn--block"
            onClick={handleFinalizar}
            disabled={linhasPendentes.length > 0}
          >
            Finalizar compra
          </button>
          {linhasPendentes.length > 0 ? (
            <p className="ck-error">
              Escolha cor e tamanho {linhasPendentes.length === 1 ? "do item marcado" : "dos itens marcados"} para
              finalizar.
            </p>
          ) : null}
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
