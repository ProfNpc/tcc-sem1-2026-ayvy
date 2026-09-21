import { apiFetch, apiJson } from "./api";

export function listFavoritos(usuarioId) {
  return apiJson(`/favoritos?usuarioId=${encodeURIComponent(usuarioId)}`);
}

export function verificarFavorito(usuarioId, produtoId) {
  return apiJson(
    `/favoritos/verificar?usuarioId=${encodeURIComponent(usuarioId)}&produtoId=${encodeURIComponent(produtoId)}`,
  );
}

export function favoritarProduto({ usuarioId, produtoId }) {
  return apiJson("/favoritos", {
    method: "POST",
    body: { usuarioId, produtoId },
  });
}

export function desfavoritarProduto(usuarioId, produtoId) {
  return apiFetch(
    `/favoritos?usuarioId=${encodeURIComponent(usuarioId)}&produtoId=${encodeURIComponent(produtoId)}`,
    { method: "DELETE" },
  );
}

export function registrarVisualizacao({ produtoId, usuarioId }) {
  return apiJson("/visualizacoes", {
    method: "POST",
    body: { produtoId, usuarioId: usuarioId ?? null },
  });
}
