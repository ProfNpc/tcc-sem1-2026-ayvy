import { Link, useSearchParams } from "react-router-dom";
import { getOrderById } from "../../utils/ordersStore";
import "./style.css";

export default function PedidoSucesso() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const order = id ? getOrderById(id) : null;

  return (
    <div className="ck-page ck-success">
      <div className="ck-success-card">
        <div className="ck-success-icon" aria-hidden>
          <i className="fas fa-check" />
        </div>
        <h1>Compra finalizada com sucesso</h1>
        <p>
          Seu pedido{order ? ` ${order.id}` : ""} foi registrado. Você pode acompanhar
          os detalhes em Meus pedidos.
        </p>
        {order ? (
          <ul className="ck-success-meta">
            <li>
              <span>Total</span>
              <strong>{order.valor}</strong>
            </li>
            <li>
              <span>Entrega</span>
              <strong>
                {order.freteNome} · {order.freteLabel}
              </strong>
            </li>
            <li>
              <span>Pagamento</span>
              <strong>{order.paymentMethod === "cartao" ? "Cartão" : "Pix"}</strong>
            </li>
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
