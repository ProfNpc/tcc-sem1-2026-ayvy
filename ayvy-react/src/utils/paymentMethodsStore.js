const KEY = "ayvy.payment-methods.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function listPaymentMethods() {
  return read();
}

export function savePaymentMethod(method) {
  const list = read();
  const next = {
    ...method,
    id: method.id || `pm-${Date.now()}`,
  };
  const merged = [next, ...list.filter((m) => m.id !== next.id)];
  write(merged);
  return next;
}

export function deletePaymentMethod(id) {
  write(read().filter((m) => m.id !== id));
}
