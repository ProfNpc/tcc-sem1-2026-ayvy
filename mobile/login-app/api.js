import { Platform } from 'react-native';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_URL;

function trimSlash(url) {
  return String(url).replace(/\/+$/, '');
}

// Endereço da API. Defina EXPO_PUBLIC_API_BASE_URL no arquivo .env.local (veja o README).
export const API_BASE_URL = trimSlash(
  configuredBaseUrl ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:8082' : 'http://localhost:8082'),
);

// Endereço do site (ayvy-react). Usado pelos links "Finalizar compra no site", "Editar perfil" etc.
export const WEB_BASE_URL = trimSlash(
  configuredWebUrl ||
    (/:\d+$/.test(API_BASE_URL) ? API_BASE_URL.replace(/:\d+$/, ':5173') : 'http://localhost:5173'),
);

// O ngrok mostra uma página de aviso antes da API; este cabeçalho pula essa página.
const extraHeaders = /ngrok/i.test(API_BASE_URL) ? { 'ngrok-skip-browser-warning': 'true' } : {};

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API em ${API_BASE_URL}. Confira se a API está ligada e se EXPO_PUBLIC_API_BASE_URL aponta para o endereço certo (veja o README).`,
    );
  }

  let data = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }
  }

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? 'E-mail ou senha inválidos.'
        : response.status === 403
          ? 'Esta conta não tem acesso ao aplicativo de clientes.'
          : `A API retornou um erro (${response.status}).`;
    throw new Error(data?.detail || data?.message || data?.title || data?.error || fallback);
  }

  return data;
}

// ---------- Login ----------
export async function authenticateClient(email, senha) {
  const usuario = await apiRequest('/usuarios/login', {
    method: 'POST',
    body: { email, senha },
  });

  if (String(usuario?.papel || '').toLowerCase() !== 'cliente') {
    throw new Error('Este aplicativo é exclusivo para contas de cliente.');
  }
  if (String(usuario?.status || '').toLowerCase() !== 'ativo') {
    throw new Error('Esta conta está inativa ou bloqueada.');
  }

  return {
    id: usuario.id,
    nome: usuario.nome || usuario.email || 'Cliente',
    email: usuario.email || email,
    telefone: usuario.telefone || '',
    avatarUrl: usuario.avatarUrl || '',
  };
}

// ---------- Catálogo ----------
export function listProducts() {
  return apiRequest('/produtos');
}

export function listStores() {
  return apiRequest('/lojistas');
}

export function listCategories() {
  return apiRequest('/categorias');
}

// ---------- Favoritos ----------
export function listFavorites(userId) {
  return apiRequest(`/favoritos?usuarioId=${encodeURIComponent(userId)}`);
}

export function addFavorite(userId, productId) {
  return apiRequest('/favoritos', {
    method: 'POST',
    body: { usuarioId: userId, produtoId: productId },
  });
}

export function removeFavorite(userId, productId) {
  return apiRequest(
    `/favoritos?usuarioId=${encodeURIComponent(userId)}&produtoId=${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  );
}

// ---------- Pedidos (histórico de compras) ----------
export function listOrders(userId) {
  return apiRequest(`/pedidos?usuarioId=${encodeURIComponent(userId)}`);
}

export function listOrderItems(orderId) {
  return apiRequest(`/pedidos/${orderId}/itens`);
}

export function listOrderHistory(orderId) {
  return apiRequest(`/pedidos/${orderId}/historico`);
}

// A API devolve caminhos como /uploads/produtos/x.jpg; aqui montamos o endereço completo.
export function resolveImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
