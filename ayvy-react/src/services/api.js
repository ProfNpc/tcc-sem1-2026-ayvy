/**
 * api.js — Camada base de comunicação com o back (Spring Boot).
 *
 * Quem usa este arquivo:
 *   - adminApi.js → funções do painel (listUsuarios, createProduto, etc.)
 *   - Outros serviços que precisam chamar a API
 *
 * Fluxo:
 *   Tela React → adminApi.listUsuarios() → apiJson("/usuarios") → apiFetch → fetch(URL)
 */

// Endereço do servidor Java. No .env do Vite: VITE_API_BASE_URL=http://localhost:8082
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";

/**
 * Monta a URL completa a partir de um caminho relativo.
 * Ex.: buildUrl("/usuarios") → "http://localhost:8082/usuarios"
 */
function buildUrl(path) {
  // Se vier "usuarios" sem barra, adiciona barra entre base e path
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  // Se vier "/usuarios", só concatena com a base
  return `${API_BASE_URL}${path}`;
}

/**
 * Faz uma requisição HTTP genérica (GET, POST, PUT, DELETE).
 * @param {string} path — Caminho da API, ex.: "/usuarios" ou "/produtos/5"
 * @param {RequestInit} [init] — Opções do fetch: method, body, headers...
 */
export async function apiFetch(path, init = {}) {
  // Junta base (localhost:8082) + path (/usuarios) numa URL só
  const url = buildUrl(path);

  // Cabeçalhos padrão: o back responde em JSON
  const headers = {
    Accept: "application/json",
    ...init.headers,
  };

  // Upload de imagem usa FormData (multipart), não JSON
  const isFormData = init.body instanceof FormData;
  // Se tem corpo e não é arquivo, avisa ao servidor que o body é JSON
  if (init.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    // Envia a requisição (ex.: GET http://localhost:8082/usuarios)
    res = await fetch(url, { ...init, headers });
  } catch {
    // fetch falhou = back desligado, porta errada ou sem internet local
    throw new Error(
      `Não foi possível conectar à API em ${API_BASE_URL}. Verifique se o back está rodando (./mvnw spring-boot:run na pasta back).`,
    );
  }

  // Status 4xx/5xx = erro de negócio ou validação no Spring
  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      // Back costuma devolver { detail: "mensagem" } em erros
      const problem = await res.json();
      message = problem.detail || problem.title || message;
    } catch {
      /* corpo da resposta não era JSON — mantém mensagem genérica */
    }
    const err = new Error(message);
    // Guarda status (404, 400…) para a tela tratar se precisar
    throw Object.assign(err, { status: res.status });
  }

  // DELETE com sucesso às vezes não traz corpo (No Content)
  if (res.status === 204) return null;

  // Lê o corpo como texto primeiro (funciona com JSON vazio ou texto puro)
  const text = await res.text();
  if (!text) return null;
  try {
    // Converte texto JSON em objeto JavaScript para as telas usarem
    return JSON.parse(text);
  } catch {
    // Se não for JSON, devolve o texto mesmo
    return text;
  }
}

/**
 * Atalho para chamar a API enviando/recebendo JSON.
 * Usado em quase todas as funções de adminApi.js.
 *
 * @param {string} path — Ex.: "/usuarios", "/lojistas/3"
 * @param {{ method?: string, body?: object }} [options]
 *   - method: "GET" (padrão), "POST", "PUT", "DELETE"
 *   - body: objeto que vira JSON no POST/PUT (ex.: { nome, email, status })
 */
export async function apiJson(path, { method = "GET", body } = {}) {
  // Repassa para apiFetch; body vira string JSON automaticamente
  return apiFetch(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
