import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listFavoritos } from "../../services/favoritosApi";
import { resolveImageUrl } from "../../utils/imageUrl";
import { formatBRL } from "../../utils/cartHelpers";
import "../MeusPedidos/style.css";

export default function Favoritos() {
  const { user, loggedIn } = useAuth();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!loggedIn || !user?.id) {
        setItens([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const list = await listFavoritos(user.id);
        if (!cancelled) setItens(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar favoritos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, user?.id]);

  if (!loggedIn) {
    return (
      <div className="ck-page mp-page">
        <div className="ck-empty">
          <h1>Favoritos</h1>
          <p>Faça login para ver seus favoritos.</p>
          <Link to="/login" className="ck-btn ck-btn--primary">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ck-page mp-page">
      <header className="mp-hero">
        <div>
          <p className="mp-eyebrow">Minha conta</p>
          <h1>Meus favoritos</h1>
          <p className="mp-sub">Produtos salvos na sua conta AYVY.</p>
        </div>
        <div className="mp-hero-actions">
          <Link to="/perfil" className="ck-btn ck-btn--ghost">
            Voltar ao perfil
          </Link>
          <Link to="/" className="ck-btn ck-btn--primary">
            Continuar comprando
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="mp-loading" role="status">
          <span className="mp-spinner" aria-hidden />
          Carregando favoritos…
        </div>
      ) : null}
      {error ? <p className="mp-error">{error}</p> : null}

      {!loading && itens.length === 0 ? (
        <div className="mp-empty">
          <div className="mp-empty-icon" aria-hidden>
            <i className="fas fa-heart" />
          </div>
          <h2>Nenhum favorito ainda</h2>
          <p>Você ainda não favoritou produtos.</p>
          <Link to="/" className="ck-btn ck-btn--primary">
            Explorar lojas
          </Link>
        </div>
      ) : (
        <ul className="mp-list">
          {itens.map((fav) => {
            const p = fav.produto || {};
            const slug = String(p.lojista?.slug || "")
              .toLowerCase()
              .replace(/-/g, "_");
            const img = resolveImageUrl(p.imagemPrincipalUrl);
            return (
              <li key={fav.id} className="mp-card">
                <div className="mp-card-top">
                  <strong>{p.nome || "Produto"}</strong>
                  <span>{formatBRL(Number(p.preco) || 0)}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : null}
                  <div>
                    <p className="mp-meta">{p.lojista?.nomeLoja || slug || "Loja"}</p>
                    {slug && p.id ? (
                      <Link to={`/loja/${slug}/p/${p.id}`}>Ver produto</Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
