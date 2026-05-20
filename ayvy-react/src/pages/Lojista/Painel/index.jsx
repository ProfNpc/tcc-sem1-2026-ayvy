import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../style.css";

export default function LojistaPainel() {
  const { user, shopSlug } = useAuth();
  const vitrinePath = shopSlug ? `/loja/${shopSlug}` : null;

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h1>Painel do lojista</h1>
        <p>
          Olá, <strong>{user?.displayName}</strong>. Cadastre e gerencie os produtos da sua loja
          aqui.
        </p>
      </header>

      {vitrinePath ? (
        <p className="panel-page-meta">
          Vitrine pública:{" "}
          <Link to={vitrinePath} target="_blank" rel="noreferrer">
            {vitrinePath}
          </Link>
        </p>
      ) : null}

      <section className="panel-page-card">
        <h2>Próximos módulos</h2>
        <ul className="panel-page-list">
          <li>Cadastrar e editar produtos</li>
          <li>Estoque e variações (cor, tamanho)</li>
          <li>Pedidos recebidos</li>
          <li>Configurações da loja</li>
        </ul>
      </section>
    </div>
  );
}
