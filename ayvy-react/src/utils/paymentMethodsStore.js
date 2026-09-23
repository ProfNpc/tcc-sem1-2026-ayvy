const KEY = "ayvy.payment-methods.v1";

function storageKey(userId) {
  if (userId != null && userId !== "") return `${KEY}.u${userId}`;
  return KEY;
}

function read(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(userId, list) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function listPaymentMethods(userId) {
  return read(userId);
}

export function savePaymentMethod(method, userId) {
  const list = read(userId);
  const digits = String(method.number || "").replace(/\D/g, "");
  const next = {
    ...method,
    number: digits || method.number || "",
    last4: method.last4 || (digits ? digits.slice(-4) : ""),
    kind: method.kind === "debito" ? "debito" : "credito",
    id: method.id || `pm-${Date.now()}`,
  };
  const merged = [next, ...list.filter((m) => m.id !== next.id)];
  write(userId, merged);
  return next;
}

export function deletePaymentMethod(id, userId) {
  write(
    userId,
    read(userId).filter((m) => m.id !== id),
  );
}
