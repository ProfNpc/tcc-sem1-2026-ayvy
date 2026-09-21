import { apiFetch, apiJson } from "./api";

export function listNotificacoes() {
  return apiJson("/notificacoes");
}

export function criarNotificacao(payload) {
  return apiJson("/notificacoes", { method: "POST", body: payload });
}

export function atualizarNotificacao(id, payload) {
  return apiJson(`/notificacoes/${id}`, { method: "PUT", body: payload });
}

export function deletarNotificacao(id) {
  return apiFetch(`/notificacoes/${id}`, { method: "DELETE" });
}

export async function listNotificacoesDoUsuario(usuarioId) {
  const all = await listNotificacoes();
  return (all || []).filter(
    (n) => n?.usuario?.id === usuarioId || n?.usuarioId === usuarioId,
  );
}
