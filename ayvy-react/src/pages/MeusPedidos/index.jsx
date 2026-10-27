/**
 * Meus pedidos do cliente (/meus-pedidos): status, linha de envio (TrackingTimeline), código de rastreio
 * e botão Confirmar entrega (PUT /pedidos/{id}/entrega-confirmada). Atualiza sozinho a cada 15 s.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import TrackingTimeline from "../../components/TrackingTimeline";
import { useAuth } from "../../context/AuthContext";
import {
  confirmarEntregaCliente,
  getPedidoItens,
  listPagamentos,
  listPedidosPorUsuario,
} from "../../services/pedidosApi";
import { formatBRL } from "../../utils/cartHelpers";
import { numeroPedidoLabel } from "../../utils/pedidoNumero";
import "./style.css";

const POLL_MS = 15000;

const STATUS_META = {
  pago: { label: "Pago", className: "mp-status--pago" },
  enviado: { label: "A caminho", className: "mp-status--enviado" },
  pendente: { label: "Pendente", className: "mp-status--pendente" },
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    className: "mp-status--pendente",
  },
  em_preparacao: { label: "Em preparação", className: "mp-status--enviado" },
  em_separacao: { label: "Preparando", className: "mp-status--enviado" },
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

async function carregarPedidos(usuarioId) {
  const [apiPedidos, pags] = await Promise.all([
    listPedidosPorUsuario(usuarioId),
    listPagamentos().catch(() => []),
  ]);
  const pagByPedido = {};
  for (const pag of pags || []) {
    const pid = pag?.pedido?.id ?? pag?.pedidoId;
    if (pid != null) pagByPedido[pid] = pag.tipo;
  }

  const enriched = await Promise.all(
    (apiPedidos || []).map(async (p) => {
      const itens = await getPedidoItens(p.id).catch(() => []);
      const itensLabel =
        (itens || [])
          .map((i) => {
            const variacao = [i.cor, i.tamanho].filter(Boolean).join(" / ");
            return `${i.quantidade}× ${i.produto?.nome || "Produto"}${variacao ? ` (${variacao})` : ""}`;
          })
          .join(" · ") || "Itens do pedido";
      const lojas = [
        ...new Set(
          (itens || [])
            .map((i) => i?.lojista?.nomeLoja || i?.produto?.lojista?.nomeLoja || "")
            .filter(Boolean),
        ),
      ];

      return {
        id: numeroPedidoLabel(itens, p.id),
        rawId: p.id,
        status: String(p.status || "").toLowerCase(),
        etapaEnvio: p.etapaEnvio || "aguardando",
        envioIniciadoEm:
          p.segundosDesdeEnvio != null ? Date.now() - Number(p.segundosDesdeEnvio) * 1000 : null,
        criadoEm: formatWhen(p.criadoEm),
        itens: itensLabel,
        loja: lojas.length ? lojas.join(", ") : "AYVY",
        pagamento: formatPagamentoTipo(pagByPedido[p.id]),
        valor: formatBRL(Number(p.valorTotal) || 0),
        entregueEm: formatWhen(p.entregueEm),
        transportadora: p.transportadora || "",
        codigoRastreio: p.codigoRastreio || "",
      };
    }),
  );

  return enriched.sort((a, b) => b.rawId - a.rawId);
}

export default function MeusPedidos() {
  const { user, loggedIn } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pedidoConfirmando, setPedidoConfirmando] = useState(null);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false);

  const usuarioId = loggedIn ? user?.id : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!usuarioId) {
        setPedidos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const lista = await carregarPedidos(usuarioId);
        if (!cancelled) setPedidos(lista);
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
  }, [usuarioId]);

  const recarregar = useCallback(async () => {
    if (!usuarioId) return;
    try {
      setPedidos(await carregarPedidos(usuarioId));
    } catch {
      /* mantém a lista atual */
    }
  }, [usuarioId]);

  const temPedidoEmAndamento = pedidos.some((p) =>
    ["pago", "em_separacao", "enviado"].includes(p.status),
  );

  useEffect(() => {
    if (!temPedidoEmAndamento) return undefined;
    const timer = setInterval(recarregar, POLL_MS);
    return () => clearInterval(timer);
  }, [temPedidoEmAndamento, recarregar]);

  async function handleConfirmarEntrega() {
    if (!pedidoConfirmando || !usuarioId) return;
    setConfirmandoEntrega(true);
    try {
      await confirmarEntregaCliente(pedidoConfirmando.rawId, usuarioId);
      setPedidoConfirmando(null);
      await recarregar();
    } catch (e) {
      setError(e.message || "Não foi possível confirmar a entrega");
      setPedidoConfirmando(null);
    } finally {
      setConfirmandoEntrega(false);
    }
  }

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
            const mostraEnvio = pedido.status !== "aguardando_pagamento" && pedido.status !== "pendente";
            return (
              <li key={pedido.rawId} className="mp-card">
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

                  {mostraEnvio ? (
                    <div className="mp-tracking">
                      <p className="mp-tracking__title">
                        <i className="fas fa-truck" aria-hidden /> Envio
                      </p>
                      <TrackingTimeline
                        etapa={pedido.etapaEnvio}
                        envioIniciadoEm={pedido.envioIniciadoEm}
                        onEtapaChange={recarregar}
                      />
                      {pedido.codigoRastreio ? (
                        <p className="mp-tracking__code">
                          <i className="fas fa-barcode" aria-hidden />{" "}
                          {pedido.transportadora ? `${pedido.transportadora} · ` : ""}
                          <strong>{pedido.codigoRastreio}</strong>
                        </p>
                      ) : null}
                      {pedido.status === "entregue" && pedido.entregueEm ? (
                        <p className="mp-tracking__done">
                          <i className="fas fa-check-circle" aria-hidden /> Entregue em{" "}
                          {pedido.entregueEm}
                        </p>
                      ) : null}
                      {pedido.status === "enviado" ? (
                        <div className="mp-tracking__confirm">
                          <button
                            type="button"
                            className="ck-btn ck-btn--primary"
                            disabled={pedido.etapaEnvio !== "entregue"}
                            onClick={() => setPedidoConfirmando(pedido)}
                          >
                            <i className="fas fa-check-double" aria-hidden /> Confirmar entrega
                          </button>
                          <small>
                            {pedido.etapaEnvio === "entregue"
                              ? "Recebeu o pacote? Confirme para finalizar o pedido."
                              : "Liberado quando o envio chegar em Entregue."}
                          </small>
                        </div>
                      ) : null}
                    </div>
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

      <ConfirmDialog
        open={!!pedidoConfirmando}
        title="Você recebeu este pedido?"
        message={
          pedidoConfirmando
            ? `Ao confirmar, o pedido ${pedidoConfirmando.id} de ${pedidoConfirmando.loja} será finalizado como entregue.`
            : ""
        }
        confirmLabel="Sim, recebi"
        cancelLabel="Ainda não"
        busy={confirmandoEntrega}
        onCancel={() => setPedidoConfirmando(null)}
        onConfirm={handleConfirmarEntrega}
      />
    </div>
  );
}
