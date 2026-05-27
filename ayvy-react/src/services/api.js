/**
 * Camada de API — preparada para integração futura (REST/GraphQL).
 * Troque BASE_URL e adicione interceptors (auth, erros) conforme o backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function buildUrl(path) {
  if (!path.startsWith("/")) return `${BASE_URL}/${path}`;
  return `${BASE_URL}${path}`;
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const url = buildUrl(path);
  const headers = {
    Accept: "application/json",
    ...init.headers,
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    throw Object.assign(err, { status: res.status });
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Exemplo: autenticação real */
export async function loginRequest(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

/** Exemplo: recurso autenticado */
export async function meRequest(token) {
  return apiFetch("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
