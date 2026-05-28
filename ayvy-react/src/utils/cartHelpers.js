/** Converte "R$ 189,90" → número */
export function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  let s = String(priceStr || "").replace(/[^\d,.]/g, "").trim();
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

export function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCep(raw) {
  const d = String(raw || "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Mesma variante = mesma linha no carrinho */
export function cartLineKey(item) {
  return [
    item.productId || item.name,
    item.color || "",
    item.size || "",
  ].join("|");
}

export function lineSubtotal(item) {
  return parsePrice(item.price) * (item.quantity || 1);
}

export function cartSubtotal(cart) {
  return cart.reduce((sum, item) => sum + lineSubtotal(item), 0);
}
