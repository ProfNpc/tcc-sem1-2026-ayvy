import { apiJson } from "./api";

/**
 * Autenticação e cadastro contra o back Spring Boot.
 */

export function loginUsuario({ email, senha }) {
  return apiJson("/usuarios/login", {
    method: "POST",
    body: { email, senha },
  });
}

export function criarUsuario(payload) {
  return apiJson("/usuarios", { method: "POST", body: payload });
}

export function criarCliente(payload) {
  return apiJson("/clientes", { method: "POST", body: payload });
}

export function criarLojista(payload) {
  return apiJson("/lojistas", { method: "POST", body: payload });
}

export function criarEndereco(payload) {
  return apiJson("/enderecos", { method: "POST", body: payload });
}

export function listLojistas() {
  return apiJson("/lojistas");
}

export async function findLojistaByUsuarioId(usuarioId) {
  const lojistas = await listLojistas();
  const uid = Number(usuarioId);
  return (
    (lojistas || []).find((l) => {
      const lid = l?.usuario?.id ?? l?.usuarioId;
      return lid != null && Number(lid) === uid;
    }) ?? null
  );
}

/**
 * Aceita e-mail completo ou atalho de desenvolvimento (admin / adm).
 * Não força lowercase no e-mail completo (match exato no back).
 */
export function resolveLoginEmail(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.includes("@")) return value;
  const aliases = {
    admin: "admin@ayvy.com.br",
    administrador: "admin@ayvy.com.br",
    adm: "admin@ayvy.com.br",
  };
  return aliases[value.toLowerCase()] || value;
}

/**
 * Converte Usuario da API + lojista opcional na sessão do front.
 */
export function sessionFromUsuario(usuario, lojista = null) {
  const role = String(usuario?.papel || "cliente").toLowerCase();
  const slug = lojista?.slug
    ? String(lojista.slug).trim().toLowerCase().replace(/-/g, "_")
    : null;
  return {
    id: usuario.id,
    role,
    login: usuario.email?.split("@")[0] || "",
    email: usuario.email || "",
    displayName: usuario.nome || lojista?.nomeLoja || usuario.email || "Usuário",
    status: usuario.status || "ativo",
    avatarUrl: usuario.avatarUrl || null,
    shopSlug: slug,
    lojistaId: lojista?.id || null,
  };
}
