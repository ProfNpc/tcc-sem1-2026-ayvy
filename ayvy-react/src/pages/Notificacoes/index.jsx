import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  atualizarNotificacao,
  deletarNotificacao,
  listNotificacoesDoUsuario,
} from "../../services/notificacoesApi";
import "../MeusPedidos/style.css";

export default function Notificacoes() {
  const { user, loggedIn } = useAuth();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const list = await listNotificacoesDoUsuario(user.id);
      setItens(list || []);
    } catch (e) {
      setError(e.message || "Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loggedIn || !user?.id) {
      setItens([]);
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on user change
  }, [loggedIn, user?.id]);

  async function marcarLida(n) {
    try {
      await atualizarNotificacao(n.id, {
        titulo: n.titulo,
        mensagem: n.mensagem,
        tipo: n.tipo,
        lida: 1,
      });
      await load();
    } catch (e) {
      alert(e.message || "Falha ao marcar como lida");
    }
  }

  async function remover(id) {
    if (!window.confirm("Excluir esta notificação?")) return;
    try {
      await deletarNotificacao(id);
      await load();
    } catch (e) {
      alert(e.message || "Falha ao excluir");
    }
  }

  if (!loggedIn) {
    return (
      <div className="ck-page">
        <div className="ck-empty">
          <h1>Notificações</h1>
          <p>Faça login para ver suas notificações.</p>
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
        <h1>Notificações</h1>
        <p>
          Avisos da sua conta. <Link to="/perfil">Voltar ao perfil</Link>
        </p>
      </header>

      {loading ? <p>Carregando…</p> : null}
      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

      {!loading && itens.length === 0 ? (
        <div className="ck-empty ck-empty--soft">
          <p>Nenhuma notificação por enquanto.</p>
        </div>
      ) : (
        <ul className="mp-list">
          {itens.map((n) => {
            const lida = Number(n.lida) === 1;
            return (
              <li key={n.id} className="mp-card" style={{ opacity: lida ? 0.75 : 1 }}>
                <div className="mp-card-top">
                  <strong>{n.titulo}</strong>
                  <span className={`mp-status ${lida ? "" : "mp-status--pago"}`}>
                    {lida ? "lida" : "nova"}
                  </span>
                </div>
                <p className="mp-meta">{n.mensagem}</p>
                <p className="mp-meta">Tipo: {n.tipo || "—"}</p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {!lida ? (
                    <button type="button" className="ck-btn" onClick={() => marcarLida(n)}>
                      Marcar lida
                    </button>
                  ) : null}
                  <button type="button" className="ck-btn" onClick={() => remover(n.id)}>
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
