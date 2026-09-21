import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listOrdersByUser } from "../../utils/ordersStore";
import "./style.css";

export default function MeusPedidos() {
  const { user, loggedIn } = useAuth();

  const pedidos = useMemo(() => {
    if (!loggedIn) return [];
    return listOrdersByUser(user?.login);
  }, [user?.login, loggedIn]);

  if (!loggedIn) {
    return (
      <div className="ck-page">
        <div className="ck-empty">
          <h1>Meus pedidos</h1>
          <p>Faça login para ver suas compras.</p>
          <Link to="/login" className="ck-btn ck-btn--primary">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ck-page">
      <header className="ck-cart-head">
        <h1>Meus pedidos</h1>
        <p>
          Compras finalizadas nesta conta.{" "}
          <Link to="/perfil">Voltar ao perfil</Link>
        </p>
      </header>

      {pedidos.length === 0 ? (
        <div className="ck-empty ck-empty--soft">
          <p>Você ainda não tem pedidos.</p>
          <Link to="/" className="ck-btn ck-btn--primary">
            Ir às compras
          </Link>
        </div>
      ) : (
        <ul className="mp-list">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="mp-card">
              <div className="mp-card-top">
                <strong>{pedido.id}</strong>
                <span className={`mp-status mp-status--${pedido.status}`}>
                  {pedido.status}
                </span>
              </div>
              <p className="mp-when">{pedido.criadoEm}</p>
              <p className="mp-itens">{pedido.itens}</p>
              <div className="mp-foot">
                <span>{pedido.loja}</span>
                <strong>{pedido.valor}</strong>
              </div>
              <p className="mp-addr">{pedido.cliente?.endereco}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
