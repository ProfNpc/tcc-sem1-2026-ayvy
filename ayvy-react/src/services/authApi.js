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
  return (lojistas || []).find((l) => l?.usuario?.id === usuarioId || l?.usuarioId === usuarioId) ?? null;
}

/**
 * Converte Usuario da API + lojista opcional na sessão do front.
 */
export function sessionFromUsuario(usuario, lojista = null) {
  const role = String(usuario?.papel || "cliente").toLowerCase();
  return {
    id: usuario.id,
    role,
    login: usuario.email?.split("@")[0] || "",
    email: usuario.email || "",
    displayName: usuario.nome || usuario.email || "Usuário",
    status: usuario.status || "ativo",
    avatarUrl: usuario.avatarUrl || null,
    shopSlug: lojista?.slug || null,
    lojistaId: lojista?.id || null,
  };
}
