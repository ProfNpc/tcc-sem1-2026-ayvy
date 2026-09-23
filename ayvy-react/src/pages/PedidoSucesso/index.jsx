import { Link, useSearchParams } from "react-router-dom";
import "./style.css";

function paymentLabel(raw) {
  const t = String(raw || "").toLowerCase();
  if (t === "pix") return "Pix";
  if (t === "cartao_credito" || t === "credito" || t === "cartao") {
    return "Cartão de crédito";
  }
  if (t === "cartao_debito" || t === "debito") return "Cartão de débito";
  return raw || "";
}

export default function PedidoSucesso() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const pay = paymentLabel(params.get("pay") || "");

  return (
    <div className="ck-page ck-success">
      <div className="ck-success-card">
        <div className="ck-success-icon" aria-hidden>
          <i className="fas fa-check" />
        </div>
        <h1>Compra finalizada com sucesso</h1>
        <p>
          Seu pedido{id ? ` ${id}` : ""} foi registrado na API. Você pode acompanhar
          os detalhes em Meus pedidos.
        </p>
        {id || pay ? (
          <ul className="ck-success-meta">
            {id ? (
              <li>
                <span>Pedido</span>
                <strong>{id}</strong>
              </li>
            ) : null}
            {pay ? (
              <li>
                <span>Pagamento</span>
                <strong>{pay}</strong>
              </li>
            ) : null}
          </ul>
        ) : null}
        <div className="ck-success-actions">
          <Link to="/meus-pedidos" className="ck-btn ck-btn--primary">
            Acessar meus pedidos
          </Link>
          <Link to="/" className="ck-btn ck-btn--ghost">
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}
