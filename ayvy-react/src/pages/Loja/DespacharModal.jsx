import { useEffect, useState } from "react";
import { formatBRL } from "../../utils/cartHelpers";

const TRANSPORTADORAS = [
  "Correios SEDEX",
  "Correios SEDEX 10",
  "Correios PAC",
  "Jadlog",
  "Loggi",
  "Outra transportadora",
];

const PADRAO_CORREIOS = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

function limparRastreio(valor) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

export default function DespacharModal({ order, paymentLabel, onClose, onConfirm }) {
  const [localPostagem, setLocalPostagem] = useState("");
  const [transportadora, setTransportadora] = useState(TRANSPORTADORAS[0]);
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const enderecoOk = localPostagem.trim().length >= 8;
  const rastreioOk = codigoRastreio.length >= 8;
  const formatoCorreios = PADRAO_CORREIOS.test(codigoRastreio);
  const valido = enderecoOk && rastreioOk;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!enderecoOk) {
      setError("Informe o endereço completo de onde o pacote foi deixado.");
      return;
    }
    if (!rastreioOk) {
      setError("Informe o número de despacho (código de rastreio) com pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm({
        localPostagem: localPostagem.trim(),
        transportadora,
        codigoRastreio,
      });
    } catch (err) {
      setError(err.message || "Não foi possível despachar o pedido.");
      setSaving(false);
    }
  }

  return (
    <div className="desp-overlay" onClick={() => !saving && onClose()}>
      <form
        className="desp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desp-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="desp-head">
          <div>
            <h2 id="desp-title">
              <i className="fas fa-shipping-fast" aria-hidden /> Marcar como despachado
            </h2>
            <p>
              Pedido {order.id} · {order.criadoEm}
            </p>
          </div>
          <button
            type="button"
            className="desp-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <i className="fas fa-times" />
          </button>
        </header>

        <div className="desp-grid">
          <section>
            <h3>Cliente</h3>
            <p>
              <strong>{order.cliente?.nome}</strong>
            </p>
            <p>{order.cliente?.email}</p>
            {order.cliente?.telefone && order.cliente.telefone !== "—" ? (
              <p>{order.cliente.telefone}</p>
            ) : null}
          </section>
          <section>
            <h3>Pagamento</h3>
            <p>
              <strong>{paymentLabel(order.paymentMethod)}</strong>
            </p>
            <p>Itens desta loja: {formatBRL(order.shopItemsTotal || 0)}</p>
          </section>
          <section className="desp-grid__full">
            <h3>Destino</h3>
            <p>{order.cliente?.endereco}</p>
          </section>
          <section className="desp-grid__full">
            <h3>Itens</h3>
            <ul className="desp-items">
              {(order.items || []).map((item) => (
                <li key={item.id}>
                  {item.image ? <img src={item.image} alt="" /> : null}
                  <span>
                    {item.quantity}× {item.name}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.size ? ` · ${item.size}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <label className="desp-field">
          <span>
            <i className="fas fa-map-marker-alt" aria-hidden /> Endereço onde o pacote foi deixado *
          </span>
          <textarea
            rows={2}
            maxLength={300}
            value={localPostagem}
            onChange={(e) => {
              setLocalPostagem(e.target.value);
              if (error) setError("");
            }}
            placeholder="Ex.: Agência dos Correios — Av. Paulista, 1000, Bela Vista, São Paulo - SP"
            autoFocus
          />
        </label>

        <div className="desp-row">
          <label className="desp-field">
            <span>
              <i className="fas fa-truck" aria-hidden /> Serviço de envio *
            </span>
            <select value={transportadora} onChange={(e) => setTransportadora(e.target.value)}>
              {TRANSPORTADORAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="desp-field">
            <span>
              <i className="fas fa-barcode" aria-hidden /> Número de despacho (rastreio) *
            </span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              spellCheck={false}
              value={codigoRastreio}
              onChange={(e) => {
                setCodigoRastreio(limparRastreio(e.target.value));
                if (error) setError("");
              }}
              placeholder="Ex.: AA123456789BR"
              className="desp-rastreio"
            />
            <small className={`desp-hint${formatoCorreios ? " desp-hint--ok" : ""}`}>
              {formatoCorreios ? (
                <>
                  <i className="fas fa-check-circle" aria-hidden /> Formato dos Correios válido
                </>
              ) : (
                "Correios: 2 letras + 9 números + 2 letras (ex.: AA123456789BR). Outras transportadoras: letras e números."
              )}
            </small>
          </label>
        </div>
        {error ? <p className="desp-error">{error}</p> : null}

        <footer className="desp-actions">
          <button type="button" className="loja-order-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            className="loja-order-btn loja-order-btn--primary"
            disabled={saving || !valido}
          >
            <i className="fas fa-shipping-fast" aria-hidden />
            {saving ? "Despachando…" : "Marcar como despachado"}
          </button>
        </footer>
      </form>
    </div>
  );
}
