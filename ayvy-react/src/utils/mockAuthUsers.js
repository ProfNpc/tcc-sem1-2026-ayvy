/** Contas de desenvolvimento — substituir por API real depois. */

export const ROLES = {
  ADMIN: "admin",
  LOJISTA: "lojista",
  CLIENTE: "cliente",
};

/** @type {Record<string, { role: string, login: string, displayName: string, shopSlug?: string }>} */
const LOGIN_ALIASES = {
  administrador: "admin",
  adm: "admin",
};

export const MOCK_AUTH_USERS = {
  admin: {
    role: ROLES.ADMIN,
    login: "admin",
    displayName: "Administrador",
  },
  itb_moda: {
    role: ROLES.LOJISTA,
    login: "itb_moda",
    displayName: "ITB Moda",
    shopSlug: "itb_moda",
  },
};

export function normalizeLoginInput(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes("@")) return value.split("@")[0];
  return value;
}

/**
 * @param {string} loginInput
 * @param {string} password
 * @returns {{ role: string, login: string, displayName: string, shopSlug?: string } | null}
 */
export function resolveMockSession(loginInput, password) {
  if (!password?.trim()) return null;

  const rawKey = normalizeLoginInput(loginInput);
  if (!rawKey) return null;

  const key = LOGIN_ALIASES[rawKey] || rawKey;
  const known = MOCK_AUTH_USERS[key];
  if (known) return { ...known };

  return {
    role: ROLES.CLIENTE,
    login: key,
    displayName: key,
  };
}

/** @param {string} role */
export function getHomePathForRole(role) {
  if (role === ROLES.ADMIN) return "/admin";
  return "/";
}

/**
 * Destino após login (prioriza papel, não a home genérica do site).
 * @param {{ role: string, shopSlug?: string }} session
 * @param {string} [from]
 */
export function getPostLoginPath(session, from) {
  if (session.role === ROLES.ADMIN) {
    return "/admin";
  }
  if (session.role === ROLES.LOJISTA) {
    return "/";
  }
  if (typeof from === "string" && from && from !== "/login" && !from.startsWith("/admin")) {
    return from;
  }
  return "/";
}

/** @param {{ role?: string, shopSlug?: string } | null} user @param {string} slug */
export function isShopOwner(user, slug) {
  if (!user || user.role !== ROLES.LOJISTA || !user.shopSlug) return false;
  const normalized = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return user.shopSlug === normalized;
}
