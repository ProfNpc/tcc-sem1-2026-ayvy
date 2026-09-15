import { formatBRL, lineSubtotal } from "./cartHelpers";

const ORDERS_KEY = "ayvy.orders.v1";
const ADDRESSES_KEY = "ayvy.addresses.v1";

const DEFAULT_ADDRESSES = [
  {
    id: "addr-1",
    label: "Casa",
    nome: "Cliente AYVY",
    rua: "Rua das Flores, 120",
    complemento: "Apt 42",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01310-100",
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function listOrders() {
  const list = readJson(ORDERS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function listOrdersByUser(login) {
  const key = String(login || "").toLowerCase();
  return listOrders().filter((o) => String(o.userLogin || "").toLowerCase() === key);
}

export function getOrderById(id) {
  return listOrders().find((o) => o.id === id) ?? null;
}

/**
 * Salva um pedido mock (checkout).
 * @returns {object} pedido criado
 */
export function saveOrder({
  cart,
  user,
  address,
  freight,
  paymentMethod,
  subtotal,
  freightValue,
  total,
}) {
  const now = new Date();
  const seq = 1000 + listOrders().length + 1;
  const id = `#AY-${seq}`;

  const lojas = [
    ...new Set(cart.map((line) => line.shopName || line.shopSlug || "AYVY").filter(Boolean)),
  ];
  const itensResumo = cart
    .map((line) => `${line.quantity || 1}× ${line.name}`)
    .join(" · ");

  const order = {
    id,
    criadoEm: formatRelative(now),
    createdAt: now.toISOString(),
    status: "pago",
    loja: lojas.join(", ") || "Marketplace AYVY",
    valor: formatBRL(total),
    valorNum: total,
    subtotal,
    freightValue,
    freteLabel: freight?.priceLabel ?? formatBRL(freightValue || 0),
    freteNome: freight?.name ?? "Frete",
    freteDias: freight?.days ?? "",
    itens: itensResumo,
    items: cart.map((line) => ({
      id: line.id,
      name: line.name,
      image: line.image,
      color: line.color,
      size: line.size,
      quantity: line.quantity || 1,
      price: line.price,
      lineTotal: lineSubtotal(line),
      shopName: line.shopName || line.shopSlug || "",
      shopSlug: line.shopSlug || "",
    })),
    paymentMethod: paymentMethod || "pix",
    userLogin: user?.login || "cliente",
    cliente: {
      nome: user?.displayName || address?.nome || "Cliente",
      email: user?.email || `${user?.login || "cliente"}@ayvy.local`,
      cpf: address?.cpf || "000.000.000-00",
      telefone: address?.telefone || "(11) 90000-0000",
      endereco: formatAddressLine(address),
    },
    address,
    trackingCode: null,
  };

  const next = [order, ...listOrders()];
  writeJson(ORDERS_KEY, next);
  return order;
}

function normalizeShopKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

/** Pedidos que têm pelo menos um item desta loja. */
export function listOrdersForShop(shopSlug) {
  const slug = normalizeShopKey(shopSlug);
  return listOrders()
    .map((order) => {
      const items = (order.items || []).filter((item) => {
        const key = normalizeShopKey(item.shopSlug || item.shopName);
        return key === slug || key.includes(slug) || slug.includes(key);
      });
      if (items.length === 0) return null;
      const itensResumo = items
        .map((line) => `${line.quantity || 1}× ${line.name}`)
        .join(" · ");
      return {
        ...order,
        items,
        itens: itensResumo,
        shopItemsTotal: items.reduce((acc, i) => acc + (i.lineTotal || 0), 0),
      };
    })
    .filter(Boolean);
}

export function countNewOrdersForShop(shopSlug) {
  return listOrdersForShop(shopSlug).filter((o) =>
    ["pago", "pendente"].includes(String(o.status || "").toLowerCase()),
  ).length;
}

export function updateOrderStatus(orderId, status, extra = {}) {
  const all = listOrders();
  const next = all.map((o) =>
    o.id === orderId
      ? {
          ...o,
          status,
          ...extra,
          updatedAt: new Date().toISOString(),
        }
      : o,
  );
  writeJson(ORDERS_KEY, next);
  return next.find((o) => o.id === orderId) ?? null;
}

export function randomTrackingCode() {
  const n = Math.floor(100000000 + Math.random() * 900000000);
  return `BR${n}AYVY`;
}

function formatAddressLine(address) {
  if (!address) return "";
  const parts = [
    address.rua,
    address.complemento,
    address.bairro,
    `${address.cidade}, ${address.uf}`,
    address.cep,
  ].filter(Boolean);
  return parts.join(" — ");
}

function formatRelative(date) {
  return `Agora · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function listAddresses() {
  const list = readJson(ADDRESSES_KEY, null);
  if (!Array.isArray(list) || list.length === 0) {
    writeJson(ADDRESSES_KEY, DEFAULT_ADDRESSES);
    return DEFAULT_ADDRESSES;
  }
  return list;
}

export function saveAddress(address) {
  const list = listAddresses();
  const next = {
    ...address,
    id: address.id || `addr-${Date.now()}`,
  };
  writeJson(ADDRESSES_KEY, [next, ...list.filter((a) => a.id !== next.id)]);
  return next;
}

/** Converte pedido salvo → formato da lista do admin */
export function orderToAdminCard(order) {
  return {
    id: order.id,
    criadoEm: order.criadoEm,
    status: order.status || "pago",
    loja: order.loja,
    valor: order.valor,
    itens: order.itens,
    cliente: order.cliente,
    fromCheckout: true,
  };
}
