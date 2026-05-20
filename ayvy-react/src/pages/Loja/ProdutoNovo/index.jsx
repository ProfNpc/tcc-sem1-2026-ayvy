import { Link, Navigate, useParams } from "react-router-dom";
import Footer from "../../../components/Footer";
import { useAuth } from "../../../context/AuthContext";
import { isShopOwner } from "../../../utils/mockAuthUsers";
import { normalizeSlugParam } from "../../../utils/lojistaData";
import "./style.css";

export default function LojaProdutoNovo() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const { user } = useAuth();
  const lojaPath = `/loja/${slug}`;

  if (!isShopOwner(user, slug)) {
    return <Navigate to={lojaPath} replace />;
  }

  return (
    <div className="loja-produto-novo-page">
      <div className="loja-produto-novo-card">
        <h1>Novo produto</h1>
        <p>
          Tela de cadastro (fotos, preço, estoque, variações). Você vai desenvolver o formulário
          completo aqui.
        </p>
        <Link to={lojaPath} className="loja-produto-novo-back">
          ← Voltar para minha loja
        </Link>
      </div>
      <Footer />
    </div>
  );
}
