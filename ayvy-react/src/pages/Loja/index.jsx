/**
 * Tela da loja (/loja/:slug). Visitante vê a vitrine. O dono vê abas de produtos, rascunhos e Pedidos:
 * confirmar recebido → começar preparo → despachar (DespacharModal) → aguardar o cliente confirmar a entrega.
 * Dados: services/lojistaApi.js (produtos e pedidos da loja) e notificacoesApi.js (aviso de entrega confirmada).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import ConfirmDialog from "../../components/ConfirmDialog";
import FloatingChat from "../../components/FloatingChat";
import TrackingTimeline from "../../components/TrackingTimeline";
import DespacharModal from "./DespacharModal";
import { useAuth } from "../../context/AuthContext";
import { formatBRL } from "../../utils/cartHelpers";
import { isShopOwner } from "../../utils/mockAuthUsers";
import { normalizeSlugParam, resolveShopsMap } from "../../utils/lojistaData";
import { enrichProduct, enrichShop } from "../../utils/productHelpers";
import {
  cancelarPedidoLojista,
  confirmarRecebimentoLojista,
  despacharPedidoLojista,
  excluirProdutoApi,
  inativarProdutoApi,
  listPedidosDoLojista,
  listProdutosDoLojista,
  mapApiProdutoToCard,
  publicarProdutoApi,
  separarPedidoLojista,
} from "../../services/lojistaApi";
import {
  atualizarNotificacao,
  listNotificacoesDoUsuario,
} from "../../services/notificacoesApi";
import "./style.css";

const FOLLOW_KEY = "ayvy.following.v1";

const ORDERS_POLL_MS = 15000;

const STATUS_LABEL = {
  aguardando_pagamento: "Aguardando pagamento",
  pendente: "Pendente",
  pago: "Pago",
  em_separacao: "Preparando",
  enviado: "Despachado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const ETAPA_LABEL = {
  recebido: "Pedido recebido",
  preparando: "Preparando",
  despachado: "Despachado",
  coletado: "Coletado",
  em_rota: "Em rota de transporte",
  entregue: "Entregue",
};

function statusPillLabel(order) {
  if (order.status === "enviado" || order.status === "pago" || order.status === "em_separacao") {
    return ETAPA_LABEL[order.etapaEnvio] || STATUS_LABEL[order.status];
  }
  return STATUS_LABEL[order.status] || order.status;
}

function OrderActions({ order, onCancel, onReceived, onPrepare, onDispatch }) {
  const { status, etapaEnvio } = order;
  if (status === "cancelado" || status === "reembolsado") return null;

  if (status === "entregue") {
    return (
      <div className="loja-order-actions">
        <span className="loja-order-done">
          <i className="fas fa-check-circle" aria-hidden /> Entrega confirmada pelo cliente
        </span>
      </div>
    );
  }

  const podeCancelar = ["aguardando_pagamento", "pago", "em_separacao", "pendente"].includes(status);

  let proximo = null;
  if (status === "pago" && etapaEnvio !== "recebido") {
    proximo = (
      <button type="button" className="loja-order-btn loja-order-btn--primary" onClick={onReceived}>
        <i className="fas fa-inbox" aria-hidden /> Confirmar pedido recebido
      </button>
    );
  } else if (status === "pago") {
    proximo = (
      <button type="button" className="loja-order-btn loja-order-btn--primary" onClick={onPrepare}>
        <i className="fas fa-box-open" aria-hidden /> Começar preparo
      </button>
    );
  } else if (status === "em_separacao") {
    proximo = (
      <button type="button" className="loja-order-btn loja-order-btn--primary" onClick={onDispatch}>
        <i className="fas fa-shipping-fast" aria-hidden /> Marcar como despachado
      </button>
    );
  } else if (status === "enviado") {
    proximo = (
      <button type="button" className="loja-order-btn" disabled>
        <i className="fas fa-check" aria-hidden /> Despachado
      </button>
    );
    if (etapaEnvio === "entregue") {
      proximo = (
        <>
          {proximo}
          <span className="loja-order-waiting">
            <i className="far fa-clock" aria-hidden /> Aguardando o cliente confirmar a entrega
          </span>
        </>
      );
    }
  } else if (status === "aguardando_pagamento" || status === "pendente") {
    proximo = (
      <button type="button" className="loja-order-btn" disabled>
        <i className="far fa-clock" aria-hidden /> Aguardando pagamento
      </button>
    );
  }

  return (
    <div className="loja-order-actions">
      {podeCancelar ? (
        <button type="button" className="loja-order-btn loja-order-btn--danger" onClick={onCancel}>
          Cancelar pedido
        </button>
      ) : null}
      {proximo}
    </div>
  );
}

function readFollowing() {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function paymentLabel(method) {
  const t = String(method || "").toLowerCase();
  if (t === "cartao" || t === "cartao_credito" || t === "credito") {
    return "Cartão de crédito";
  }
  if (t === "cartao_debito" || t === "debito") return "Cartão de débito";
  if (t === "pix") return "Pix";
  return method || "—";
}

export default function Loja() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const { user } = useAuth();
  const isOwner = isShopOwner(user, slug);
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopsMap, setShopsMap] = useState(null);

  const initialTab = searchParams.get("aba");
  const [ownerTab, setOwnerTab] = useState(
    initialTab === "rascunhos" || initialTab === "pedidos" ? initialTab : "produtos",
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [followingSlugs, setFollowingSlugs] = useState(() => readFollowing());
  const [tick, setTick] = useState(0);
  const [ownerProdutos, setOwnerProdutos] = useState([]);
  const [ownerDrafts, setOwnerDrafts] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [avisosEntrega, setAvisosEntrega] = useState([]);

  const lojistaId = isOwner ? user?.lojistaId : null;
  const donoUsuarioId = isOwner ? user?.id : null;

  const reloadAvisosEntrega = useCallback(async () => {
    if (!donoUsuarioId) {
      setAvisosEntrega([]);
      return;
    }
    try {
      const notifs = await listNotificacoesDoUsuario(donoUsuarioId);
      setAvisosEntrega(
        (notifs || []).filter(
          (n) =>
            n.tipo === "pedido_loja" &&
            !n.lida &&
            String(n.titulo || "").startsWith("Entrega confirmada"),
        ),
      );
    } catch {
      /* mantém os avisos atuais */
    }
  }, [donoUsuarioId]);

  const reloadOrders = useCallback(async () => {
    if (!lojistaId) return;
    try {
      const [pedidos] = await Promise.all([listPedidosDoLojista(lojistaId), reloadAvisosEntrega()]);
      setShopOrders(pedidos);
    } catch {
      /* mantém a lista atual */
    }
  }, [lojistaId, reloadAvisosEntrega]);

  useEffect(() => {
    const primeiro = setTimeout(reloadAvisosEntrega, 0);
    return () => clearTimeout(primeiro);
  }, [reloadAvisosEntrega]);

  function avisoEntregaDoPedido(order) {
    return avisosEntrega.find((n) => String(n.titulo || "").includes(order.id));
  }

  async function marcarAvisoVisto(aviso) {
    setAvisosEntrega((prev) => prev.filter((n) => n.id !== aviso.id));
    try {
      await atualizarNotificacao(aviso.id, {
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        tipo: aviso.tipo,
        lida: true,
      });
    } catch {
      reloadAvisosEntrega();
    }
  }

  const hasOrderInTransit = shopOrders.some((o) => o.status === "enviado");

  useEffect(() => {
    if (!hasOrderInTransit) return undefined;
    const timer = setInterval(reloadOrders, ORDERS_POLL_MS);
    return () => clearInterval(timer);
  }, [hasOrderInTransit, reloadOrders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = await resolveShopsMap();
      if (!cancelled) setShopsMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isOwner || !user?.lojistaId) {
        setOwnerProdutos([]);
        setOwnerDrafts([]);
        setShopOrders([]);
        return;
      }
      setOwnerLoading(true);
      try {
        const [ativos, rascunhos, pedidos] = await Promise.all([
          listProdutosDoLojista(user.lojistaId, "ativo"),
          listProdutosDoLojista(user.lojistaId, "rascunho"),
          listPedidosDoLojista(user.lojistaId),
        ]);
        if (cancelled) return;
        setOwnerProdutos((ativos || []).map(mapApiProdutoToCard));
        setOwnerDrafts(
          (rascunhos || []).map((p) => ({
            ...mapApiProdutoToCard(p),
            images: mapApiProdutoToCard(p).images,
          })),
        );
        setShopOrders(pedidos || []);
      } catch {
        if (!cancelled) {
          setOwnerProdutos([]);
          setOwnerDrafts([]);
          setShopOrders([]);
        }
      } finally {
        if (!cancelled) setOwnerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwner, user?.lojistaId, tick]);

  const shopRaw = shopsMap?.[slug];
  const shop = shopRaw ? enrichShop(shopRaw, slug) : null;

  const newOrdersCount = useMemo(
    () =>
      shopOrders.filter((o) =>
        ["aguardando_pagamento", "pago", "em_separacao", "pendente"].includes(o.status),
      ).length + avisosEntrega.length,
    [shopOrders, avisosEntrega],
  );

  if (!shopsMap) {
    return (
      <div className="loja-not-found">
        <p>Carregando loja…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="loja-not-found">
        <p>Loja não encontrada.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const isFollowing = followingSlugs.includes(slug);
  const catalogProducts = isOwner
    ? ownerProdutos
    : shop.products || [];

  function selectTab(tab) {
    setOwnerTab(tab);
    setSearchParams(tab === "produtos" ? {} : { aba: tab }, { replace: true });
  }

  function refresh() {
    setTick((t) => t + 1);
  }

  function toggleFollow() {
    setFollowingSlugs((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleDeleteProduct(productId) {
    const ok = window.confirm("Remover este produto da vitrine?");
    if (!ok) return;
    try {
      await inativarProdutoApi(productId);
      refresh();
    } catch (e) {
      alert(e.message || "Falha ao remover produto");
    }
  }

  async function handlePublishDraft(draftId) {
    try {
      await publicarProdutoApi(draftId);
      refresh();
      selectTab("produtos");
    } catch (e) {
      alert(e.message || "Falha ao publicar");
    }
  }

  async function handleDeleteDraft(draftId) {
    if (!window.confirm("Excluir este rascunho?")) return;
    try {
      await excluirProdutoApi(draftId);
      refresh();
    } catch (e) {
      alert(e.message || "Falha ao excluir rascunho");
    }
  }

  async function handleConfirmReceived(order) {
    try {
      await confirmarRecebimentoLojista(order.apiId, user?.id);
      await reloadOrders();
    } catch (e) {
      alert(e.message || "Falha ao confirmar o recebimento");
    }
  }

  async function handleSeparateOrder(order) {
    try {
      await separarPedidoLojista(order.apiId, user?.id);
      await reloadOrders();
    } catch (e) {
      alert(e.message || "Falha ao iniciar o preparo");
    }
  }

  async function handleDispatch(envio) {
    await despacharPedidoLojista(dispatchOrder.apiId, user?.id, envio);
    setDispatchOrder(null);
    await reloadOrders();
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setConfirmBusy(true);
    try {
      await cancelarPedidoLojista(confirmAction.order.apiId, user?.id);
      setConfirmAction(null);
      await reloadOrders();
    } catch (e) {
      alert(e.message || "Não foi possível atualizar o pedido");
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="page-loja-extra">
      <section className="loja-hero">
        <img src={shop.avatar} alt="" className="loja-hero-avatar" />
        <div className="loja-hero-content">
          {isOwner ? <span className="loja-owner-badge">Sua loja</span> : null}
          <h1 className="loja-hero-title">{shop.name}</h1>
          <p className="loja-hero-handle">{shop.handle}</p>
          <p className="loja-hero-bio">{shop.bio}</p>
          <div className="loja-stats">
            {(shop.stats || []).map((s) => (
              <span key={s.label}>
                <strong>{s.value}</strong> {s.label}
              </span>
            ))}
          </div>
        </div>
        {!isOwner ? (
          <div className="loja-hero-actions">
            <button
              type="button"
              className={`loja-btn-follow ${isFollowing ? "is-following" : ""}`}
              onClick={toggleFollow}
              aria-pressed={isFollowing}
            >
              {isFollowing ? (
                <>
                  <i className="fas fa-check" aria-hidden /> Seguindo
                </>
              ) : (
                <>
                  <i className="fas fa-plus" aria-hidden /> Seguir
                </>
              )}
            </button>
            <button
              type="button"
              className="loja-btn-message"
              onClick={() => setChatOpen(true)}
            >
              <i className="fas fa-comment-dots" aria-hidden /> Enviar mensagem
            </button>
          </div>
        ) : null}
      </section>

      <section className="loja-catalogo">
        {isOwner ? (
          <nav className="loja-owner-tabs" aria-label="Área da lojista">
            <button
              type="button"
              className={`loja-owner-tab${ownerTab === "produtos" ? " is-active" : ""}`}
              onClick={() => selectTab("produtos")}
            >
              Meus produtos
            </button>
            <button
              type="button"
              className={`loja-owner-tab${ownerTab === "rascunhos" ? " is-active" : ""}`}
              onClick={() => selectTab("rascunhos")}
            >
              Rascunhos
              {ownerDrafts.length > 0 ? (
                <span className="loja-tab-count">{ownerDrafts.length}</span>
              ) : null}
            </button>
            <button
              type="button"
              className={`loja-owner-tab${ownerTab === "pedidos" ? " is-active" : ""}`}
              onClick={() => selectTab("pedidos")}
            >
              Pedidos
              {newOrdersCount > 0 ? (
                <span className="loja-tab-badge" aria-label={`${newOrdersCount} novos`}>
                  {newOrdersCount}
                </span>
              ) : null}
            </button>
          </nav>
        ) : (
          <h2 className="loja-produtos-titulo">Recomendado para você</h2>
        )}

        {ownerLoading && isOwner ? <p className="loja-empty-hint">Carregando dados da API…</p> : null}

        {(!isOwner || ownerTab === "produtos") && (
          <div className="loja-product-grid">
            {catalogProducts.map((p) => {
              const product = enrichProduct(p, shop);
              return (
                <Card
                  key={p.id}
                  variant="product"
                  title={product.title}
                  img={product.images[0]}
                  price={product.price}
                  rating={product.rating}
                  soldCount={product.soldCount}
                  discountPercent={product.discountPercent}
                  productId={product.id}
                  shopSlug={slug}
                  ownerMode={isOwner}
                  onDelete={() => handleDeleteProduct(p.apiId || p.id)}
                  editTo={`/loja/${slug}/produto/${p.apiId || p.id}/editar`}
                />
              );
            })}
            {isOwner ? (
              <Link to={`/loja/${slug}/produto/novo`} className="loja-add-product-card">
                <span className="loja-add-product-card__icon" aria-hidden>
                  +
                </span>
                <span className="loja-add-product-card__label">Adicionar produto</span>
              </Link>
            ) : null}
          </div>
        )}

        {isOwner && ownerTab === "rascunhos" && (
          <div className="loja-product-grid">
            {ownerDrafts.length === 0 ? (
              <p className="loja-empty-hint">
                Nenhum rascunho na API. Em{" "}
                <Link to={`/loja/${slug}/produto/novo`}>cadastrar produto</Link>, use{" "}
                <strong>Salvar rascunho</strong>.
              </p>
            ) : (
              ownerDrafts.map((draft) => (
                <article key={draft.id} className="loja-draft-card">
                  <div className="loja-draft-card__img-wrap">
                    <img src={draft.images?.[0] || draft.img} alt="" />
                    <span className="loja-draft-tag">Rascunho</span>
                  </div>
                  <strong>{draft.title}</strong>
                  <span className="loja-draft-price">{draft.price}</span>
                  <div className="loja-draft-actions">
                    <button
                      type="button"
                      className="loja-draft-btn loja-draft-btn--primary"
                      onClick={() => handlePublishDraft(draft.apiId || draft.id)}
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      className="loja-draft-btn"
                      onClick={() => handleDeleteDraft(draft.apiId || draft.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
            <Link to={`/loja/${slug}/produto/novo`} className="loja-add-product-card">
              <span className="loja-add-product-card__icon" aria-hidden>
                +
              </span>
              <span className="loja-add-product-card__label">Novo rascunho</span>
            </Link>
          </div>
        )}

        {isOwner && ownerTab === "pedidos" && (
          <div className="loja-orders">
            {shopOrders.length === 0 ? (
              <p className="loja-empty-hint">
                Ainda não há pedidos desta loja na API. Quando um cliente finalizar a compra
                com produtos seus, o pedido aparece aqui.
              </p>
            ) : (
              shopOrders.map((order) => {
                const avisoEntrega = avisoEntregaDoPedido(order);
                return (
                <article
                  key={order.id}
                  className={`loja-order-card${avisoEntrega ? " loja-order-card--aviso" : ""}`}
                >
                  {order.status === "entregue" ? (
                    <div className={`loja-order-notice${avisoEntrega ? " is-new" : ""}`} role="status">
                      <span className="loja-order-notice__icon" aria-hidden>
                        <i className="fas fa-bell" />
                      </span>
                      <div className="loja-order-notice__text">
                        <strong>
                          Entrega confirmada pelo cliente
                          {avisoEntrega ? <span className="loja-order-notice__badge">Nova</span> : null}
                        </strong>
                        <span>
                          {order.cliente?.nome || "O cliente"} confirmou que recebeu o pedido
                          {order.envio?.entregueEm ? ` em ${order.envio.entregueEm}` : ""}.
                        </span>
                      </div>
                      {avisoEntrega ? (
                        <button
                          type="button"
                          className="loja-order-notice__ok"
                          onClick={() => marcarAvisoVisto(avisoEntrega)}
                        >
                          Ok, visto
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="loja-order-card__top">
                    <div>
                      <strong className="loja-order-id">{order.id}</strong>
                      <span className="loja-order-when">{order.criadoEm}</span>
                    </div>
                    <span className={`loja-order-status loja-order-status--${order.status}`}>
                      {statusPillLabel(order)}
                    </span>
                  </div>

                  <div className="loja-order-grid">
                    <div>
                      <h3>Cliente</h3>
                      <p>
                        <strong>{order.cliente?.nome}</strong>
                      </p>
                      <p>{order.cliente?.email}</p>
                      <p>{order.cliente?.telefone}</p>
                    </div>
                    <div>
                      <h3>Entrega</h3>
                      <p>{order.cliente?.endereco}</p>
                    </div>
                    <div>
                      <h3>Pagamento</h3>
                      <p>
                        <strong>{paymentLabel(order.paymentMethod)}</strong>
                      </p>
                      <p>Total do pedido: {order.valor}</p>
                      {order.shopItemsTotal ? (
                        <p>Itens desta loja: {formatBRL(order.shopItemsTotal)}</p>
                      ) : null}
                    </div>
                  </div>

                  <ul className="loja-order-items">
                    {(order.items || []).map((item) => (
                      <li key={item.id}>
                        <img src={item.image} alt="" />
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            Qtd {item.quantity || 1}
                            {item.color ? ` · ${item.color}` : ""}
                            {item.size ? ` · ${item.size}` : ""}
                          </span>
                        </div>
                        <em>{formatBRL(item.lineTotal || 0)}</em>
                      </li>
                    ))}
                  </ul>

                  <div className="loja-order-shipping">
                    <div className="loja-order-shipping__head">
                      <i className="fas fa-truck" aria-hidden />
                      <strong>Envio</strong>
                    </div>
                    <TrackingTimeline
                      etapa={order.etapaEnvio}
                      envioIniciadoEm={order.envioIniciadoEm}
                      onEtapaChange={reloadOrders}
                    />
                    {order.envio?.localPostagem || order.envio?.enviadoEm || order.envio?.entregueEm ? (
                      <div className="loja-order-shipping__info">
                        {order.envio?.localPostagem ? (
                          <span>
                            <i className="fas fa-map-marker-alt" aria-hidden /> Pacote deixado em:{" "}
                            {order.envio.localPostagem}
                          </span>
                        ) : null}
                        {order.envio?.codigoRastreio ? (
                          <span>
                            <i className="fas fa-barcode" aria-hidden />{" "}
                            {order.envio.transportadora ? `${order.envio.transportadora} · ` : ""}
                            <strong>{order.envio.codigoRastreio}</strong>
                          </span>
                        ) : null}
                        {order.envio?.enviadoEm ? (
                          <span>
                            <i className="far fa-clock" aria-hidden /> Despachado em {order.envio.enviadoEm}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <OrderActions
                    order={order}
                    onCancel={() => setConfirmAction({ type: "cancelar", order })}
                    onReceived={() => handleConfirmReceived(order)}
                    onPrepare={() => handleSeparateOrder(order)}
                    onDispatch={() => setDispatchOrder(order)}
                  />
                </article>
                );
              })
            )}
          </div>
        )}
      </section>

      {dispatchOrder ? (
        <DespacharModal
          order={dispatchOrder}
          paymentLabel={paymentLabel}
          onClose={() => setDispatchOrder(null)}
          onConfirm={handleDispatch}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirmAction}
        title="Cancelar este pedido?"
        message={
          confirmAction
            ? `O pedido ${confirmAction.order.id} será cancelado e o cliente será avisado.`
            : ""
        }
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        danger
        busy={confirmBusy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      {!isOwner ? (
        <FloatingChat
          shopName={shop.name}
          shopAvatar={shop.avatar}
          defaultOpen={chatOpen}
          onOpenChange={setChatOpen}
        />
      ) : null}
    </div>
  );
}
