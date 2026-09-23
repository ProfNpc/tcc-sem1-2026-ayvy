import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPedidoItens, listPedidosPorUsuario } from "../../services/pedidosApi";
import { listOrdersByUser } from "../../utils/ordersStore";
import { formatBRL } from "../../utils/cartHelpers";
import "./style.css";

const STATUS_META = {
  pago: { label: "Pago", className: "mp-status--pago" },
  enviado: { label: "Enviado", className: "mp-status--enviado" },
  pendente: { label: "Pendente", className: "mp-status--pendente" },
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    className: "mp-status--pendente",
  },
  em_preparacao: { label: "Em preparação", className: "mp-status--enviado" },
  entregue: { label: "Entregue", className: "mp-status--pago" },
  cancelado: { label: "Cancelado", className: "mp-status--cancelado" },
};

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function statusMeta(raw) {
  const key = String(raw || "").toLowerCase().replace(/\s+/g, "_");
  return (
    STATUS_META[key] || {
      label: raw || "Status",
      className: "mp-status--pendente",
    }
  );
}

export default function MeusPedidos() {
  const { user, loggedIn } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!loggedIn) {
        setPedidos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        if (user?.id) {
          const apiPedidos = await listPedidosPorUsuario(user.id);
          const enriched = await Promise.all(
            (apiPedidos || []).map(async (p) => {
              let itensLabel = "Itens do pedido";
              let itemCount = 0;
              try {
                const itens = await getPedidoItens(p.id);
                itemCount = (itens || []).length;
                itensLabel = (itens || [])
                  .map((i) => `${i.quantidade}× ${i.produto?.nome || "Produto"}`)
                  .join(" · ");
              } catch {
                /* ignore */
              }
              return {
                id: `#AY-${p.id}`,
                rawId: p.id,
                status: String(p.status || "").toLowerCase(),
                criadoEm: formatWhen(p.criadoEm),
                itens: itensLabel,
                itemCount,
                loja: "AYVY",
                valor: formatBRL(Number(p.valorTotal) || 0),
                cliente: { endereco: "" },
              };
            }),
          );
          if (!cancelled) setPedidos(enriched);
        } else if (!cancelled) {
          setPedidos(listOrdersByUser(user?.login));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Erro ao carregar pedidos");
          setPedidos(listOrdersByUser(user?.login));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.login, loggedIn]);

  if (!loggedIn) {
    return (
      <div className="ck-page mp-page">
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
    <div className="ck-page mp-page">
      <header className="mp-hero">
        <div>
          <p className="mp-eyebrow">Minha conta</p>
          <h1>Meus pedidos</h1>
          <p className="mp-sub">
            Acompanhe status e detalhes das suas compras na AYVY.
          </p>
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
          Carregando seus pedidos…
        </div>
      ) : null}

      {error ? <p className="mp-error">{error}</p> : null}

      {!loading && pedidos.length === 0 ? (
        <div className="mp-empty">
          <div className="mp-empty-icon" aria-hidden>
            <i className="fas fa-box-open" />
          </div>
          <h2>Nenhum pedido ainda</h2>
          <p>Quando você finalizar uma compra, ela aparece aqui.</p>
          <Link to="/" className="ck-btn ck-btn--primary">
            Explorar lojas
          </Link>
        </div>
      ) : null}

      {!loading && pedidos.length > 0 ? (
        <ul className="mp-list">
          {pedidos.map((pedido) => {
            const meta = statusMeta(pedido.status);
            return (
              <li key={pedido.id} className="mp-card">
                <div className="mp-card-accent" aria-hidden />
                <div className="mp-card-body">
                  <div className="mp-card-top">
                    <div>
                      <strong className="mp-id">{pedido.id}</strong>
                      <p className="mp-when">
                        <i className="far fa-clock" aria-hidden /> {pedido.criadoEm}
                      </p>
                    </div>
                    <span className={`mp-status ${meta.className}`}>{meta.label}</span>
                  </div>

                  <p className="mp-itens">{pedido.itens}</p>

                  <div className="mp-foot">
                    <span className="mp-loja">
                      <i className="fas fa-store" aria-hidden /> {pedido.loja}
                      {pedido.itemCount ? (
                        <em>
                          · {pedido.itemCount}{" "}
                          {pedido.itemCount === 1 ? "item" : "itens"}
                        </em>
                      ) : null}
                    </span>
                    <strong className="mp-valor">{pedido.valor}</strong>
                  </div>

                  {pedido.cliente?.endereco ? (
                    <p className="mp-addr">{pedido.cliente.endereco}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
