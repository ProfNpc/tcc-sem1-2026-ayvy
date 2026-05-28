/**
 * Cliente HTTP para a API Spring Boot (back).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";

function buildUrl(path) {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
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

  const isFormData = init.body instanceof FormData;
  if (init.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(
      `Não foi possível conectar à API em ${API_BASE_URL}. Verifique se o back está rodando (./mvnw spring-boot:run na pasta back).`,
    );
  }

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      const problem = await res.json();
      message = problem.detail || problem.title || message;
    } catch {
      /* ignore */
    }
    const err = new Error(message);
    throw Object.assign(err, { status: res.status });
  }

  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiJson(path, { method = "GET", body } = {}) {
  return apiFetch(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
