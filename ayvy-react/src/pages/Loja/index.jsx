import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import FloatingChat from "../../components/FloatingChat";
import { useAuth } from "../../context/AuthContext";
import { formatBRL } from "../../utils/cartHelpers";
import { isShopOwner } from "../../utils/mockAuthUsers";
import { SHOPS, normalizeSlugParam } from "../../utils/lojistaData";
import {
  countNewOrdersForShop,
  listOrdersForShop,
  randomTrackingCode,
  updateOrderStatus,
} from "../../utils/ordersStore";
import { enrichProduct, enrichShop } from "../../utils/productHelpers";
import {
  deleteDraft,
  deletePublishedExtra,
  listDrafts,
  listPublishedExtras,
  publishDraft,
} from "../../utils/shopOwnerStore";
import "./style.css";

const FOLLOW_KEY = "ayvy.following.v1";

function readFollowing() {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function paymentLabel(method) {
  if (method === "cartao") return "Cartão de crédito";
  if (method === "pix") return "Pix";
  return method || "—";
}

export default function Loja() {
  const { slug: raw } = useParams();
  const slug = normalizeSlugParam(raw || "");
  const shopRaw = SHOPS[slug];
  const shop = shopRaw ? enrichShop(shopRaw, slug) : null;
  const { user } = useAuth();
  const isOwner = isShopOwner(user, slug);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("aba");
  const [ownerTab, setOwnerTab] = useState(
    initialTab === "rascunhos" || initialTab === "pedidos" ? initialTab : "produtos",
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [followingSlugs, setFollowingSlugs] = useState(() => readFollowing());
  const [hiddenProductIds, setHiddenProductIds] = useState([]);
  const [tick, setTick] = useState(0);

  const drafts = useMemo(
    () => (isOwner ? listDrafts(slug) : []),
    [isOwner, slug, tick],
  );
  const publishedExtras = useMemo(
    () => (isOwner ? listPublishedExtras(slug) : []),
    [isOwner, slug, tick],
  );
  const shopOrders = useMemo(
    () => (isOwner ? listOrdersForShop(slug) : []),
    [isOwner, slug, tick],
  );
  const newOrdersCount = useMemo(
    () => (isOwner ? countNewOrdersForShop(slug) : 0),
    [isOwner, slug, tick],
  );

  if (!shop) {
    return (
      <div className="loja-not-found">
        <p>Loja não encontrada.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const isFollowing = followingSlugs.includes(slug);
  const catalogProducts = [
    ...publishedExtras,
    ...shop.products.filter((p) => !hiddenProductIds.includes(p.id)),
  ];

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

  function handleDeleteProduct(productId) {
    const ok = window.confirm("Remover este produto da vitrine?");
    if (!ok) return;
    if (String(productId).startsWith("pub-")) {
      deletePublishedExtra(productId);
      refresh();
      return;
    }
    setHiddenProductIds((prev) => [...prev, productId]);
  }

  function handlePublishDraft(draftId) {
    publishDraft(draftId);
    refresh();
    selectTab("produtos");
  }

  function handleDeleteDraft(draftId) {
    if (!window.confirm("Excluir este rascunho?")) return;
    deleteDraft(draftId);
    refresh();
  }

  function handleCancelOrder(orderId) {
    if (!window.confirm("Cancelar este pedido do cliente?")) return;
    updateOrderStatus(orderId, "cancelado");
    refresh();
  }

  function handleSendOrder(orderId) {
    const code = randomTrackingCode();
    updateOrderStatus(orderId, "enviado", { trackingCode: code });
    alert(`Pedido marcado como enviado!\nCódigo dos Correios (mock): ${code}`);
    refresh();
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
            {shop.stats.map((s) => (
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
              {drafts.length > 0 ? (
                <span className="loja-tab-count">{drafts.length}</span>
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
                  onDelete={() => handleDeleteProduct(p.id)}
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
            {drafts.length === 0 ? (
              <p className="loja-empty-hint">
                Nenhum rascunho ainda. Em{" "}
                <Link to={`/loja/${slug}/produto/novo`}>cadastrar produto</Link>, use{" "}
                <strong>Salvar rascunho</strong>.
              </p>
            ) : (
              drafts.map((draft) => (
                <article key={draft.id} className="loja-draft-card">
                  <div className="loja-draft-card__img-wrap">
                    <img src={draft.images?.[0]} alt="" />
                    <span className="loja-draft-tag">Rascunho</span>
                  </div>
                  <strong>{draft.title}</strong>
                  <span className="loja-draft-price">{draft.price}</span>
                  <div className="loja-draft-actions">
                    <button
                      type="button"
                      className="loja-draft-btn loja-draft-btn--primary"
                      onClick={() => handlePublishDraft(draft.id)}
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      className="loja-draft-btn"
                      onClick={() => handleDeleteDraft(draft.id)}
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
                Ainda não há pedidos desta loja. Quando um cliente finalizar a compra com
                produtos seus, o pedido aparece aqui.
              </p>
            ) : (
              shopOrders.map((order) => (
                <article key={order.id} className="loja-order-card">
                  <div className="loja-order-card__top">
                    <div>
                      <strong className="loja-order-id">{order.id}</strong>
                      <span className="loja-order-when">{order.criadoEm}</span>
                    </div>
                    <span className={`loja-order-status loja-order-status--${order.status}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="loja-order-grid">
                    <div>
                      <h3>Cliente</h3>
                      <p>
                        <strong>{order.cliente?.nome}</strong>
                      </p>
                      <p>{order.cliente?.email}</p>
                      <p>CPF {order.cliente?.cpf}</p>
                      <p>{order.cliente?.telefone}</p>
                    </div>
                    <div>
                      <h3>Entrega</h3>
                      <p>{order.cliente?.endereco}</p>
                      <p>
                        Frete: {order.freteNome} · {order.freteLabel}
                      </p>
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
                            {[item.color, item.size].filter(Boolean).join(" · ")}
                            {(item.color || item.size) && " · "}
                            Qtd {item.quantity || 1}
                          </span>
                        </div>
                        <em>{formatBRL(item.lineTotal || 0)}</em>
                      </li>
                    ))}
                  </ul>

                  {order.trackingCode ? (
                    <p className="loja-order-tracking">
                      Código de rastreio: <strong>{order.trackingCode}</strong>
                    </p>
                  ) : null}

                  {order.status !== "cancelado" && order.status !== "enviado" ? (
                    <div className="loja-order-actions">
                      <button
                        type="button"
                        className="loja-order-btn loja-order-btn--danger"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancelar pedido
                      </button>
                      <button
                        type="button"
                        className="loja-order-btn loja-order-btn--primary"
                        onClick={() => handleSendOrder(order.id)}
                      >
                        Enviar pedido
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <Footer />
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
