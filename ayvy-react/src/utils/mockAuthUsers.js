/** Contas de desenvolvimento — substituir por API real depois. */

export const ROLES = {
  ADMIN: "admin",
  LOJISTA: "lojista",
  CLIENTE: "cliente",
};

/** @type {Record<string, { role: string, login: string, displayName: string, shopSlug?: string }>} */
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

  const key = normalizeLoginInput(loginInput);
  if (!key) return null;

  const known = MOCK_AUTH_USERS[key];
  if (known) return { ...known };

  return {
    role: ROLES.CLIENTE,
    login: key,
    displayName: key,
  };
}

/** @param {string} role @param {string} [shopSlug] */
export function getHomePathForRole(role, shopSlug) {
  if (role === ROLES.ADMIN) return "/admin";
  if (role === ROLES.LOJISTA) {
    return shopSlug ? `/loja/${shopSlug}` : "/";
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
