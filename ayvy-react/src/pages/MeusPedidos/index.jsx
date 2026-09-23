import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getPedidoItens,
  listPagamentos,
  listPedidosPorUsuario,
} from "../../services/pedidosApi";
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
  em_separacao: { label: "Em separação", className: "mp-status--enviado" },
  entregue: { label: "Entregue", className: "mp-status--pago" },
  cancelado: { label: "Cancelado", className: "mp-status--cancelado" },
};

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function formatPagamentoTipo(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t === "pix") return "Pix";
  if (t === "cartao_credito" || t === "credito") return "Cartão de crédito";
  if (t === "cartao_debito" || t === "debito") return "Cartão de débito";
  return "";
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
      if (!loggedIn || !user?.id) {
        setPedidos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [apiPedidos, pags] = await Promise.all([
          listPedidosPorUsuario(user.id),
          listPagamentos().catch(() => []),
        ]);
        const pagByPedido = {};
        for (const pag of pags || []) {
          const pid = pag?.pedido?.id ?? pag?.pedidoId;
          if (pid != null) pagByPedido[pid] = pag.tipo;
        }
        const enriched = await Promise.all(
          (apiPedidos || []).map(async (p) => {
            let itensLabel = "Itens do pedido";
            let itemCount = 0;
            let loja = "AYVY";
            try {
              const itens = await getPedidoItens(p.id);
              itemCount = (itens || []).length;
              itensLabel = (itens || [])
                .map((i) => `${i.quantidade}× ${i.produto?.nome || "Produto"}`)
                .join(" · ");
              const lojas = [
                ...new Set(
                  (itens || [])
                    .map(
                      (i) =>
                        i?.lojista?.nomeLoja ||
                        i?.produto?.lojista?.nomeLoja ||
                        "",
                    )
                    .filter(Boolean),
                ),
              ];
              if (lojas.length) loja = lojas.join(", ");
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
              loja,
              pagamento: formatPagamentoTipo(pagByPedido[p.id]),
              valor: formatBRL(Number(p.valorTotal) || 0),
            };
          }),
        );
        if (!cancelled) setPedidos(enriched);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Erro ao carregar pedidos");
          setPedidos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loggedIn]);

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
          <p>
            Quando você finalizar uma compra com produtos cadastrados na API, ela
            aparece aqui.
          </p>
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
                      <strong className="mp-loja-name">
                        <i className="fas fa-store" aria-hidden /> {pedido.loja}
                      </strong>
                      <p className="mp-when">
                        <i className="far fa-clock" aria-hidden /> {pedido.criadoEm}
                      </p>
                    </div>
                    <span className={`mp-status ${meta.className}`}>{meta.label}</span>
                  </div>

                  <p className="mp-itens">{pedido.itens}</p>

                  {pedido.pagamento ? (
                    <p className="mp-pay">
                      <i className="fas fa-wallet" aria-hidden /> {pedido.pagamento}
                    </p>
                  ) : null}

                  <div className="mp-foot">
                    <span className="mp-order-id">{pedido.id}</span>
                    <strong className="mp-valor">{pedido.valor}</strong>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
