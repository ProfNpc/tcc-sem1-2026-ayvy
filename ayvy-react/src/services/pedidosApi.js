import { apiFetch, apiJson } from "./api";

export function checkoutPedido(payload) {
  return apiJson("/pedidos/checkout", { method: "POST", body: payload });
}

export function listPedidosPorUsuario(usuarioId) {
  return apiJson(`/pedidos?usuarioId=${encodeURIComponent(usuarioId)}`);
}

export function listTodosPedidos() {
  return apiJson("/pedidos/all");
}

export function getPedido(id) {
  return apiJson(`/pedidos/${id}`);
}

export function getPedidoItens(id) {
  return apiJson(`/pedidos/${id}/itens`);
}

export function getPedidoEndereco(id) {
  return apiJson(`/pedidos/${id}/endereco-entrega`);
}

export function atualizarStatusPedido(id, status, actorUsuarioId) {
  const params = new URLSearchParams({ novoStatus: status });
  if (actorUsuarioId != null) params.set("actorUsuarioId", String(actorUsuarioId));
  return apiJson(`/pedidos/${id}/status?${params}`, { method: "PUT" });
}

export function calcularFrete({ cepDestino, itens }) {
  return apiJson("/frete/calcular", {
    method: "POST",
    body: { cepDestino, itens },
  });
}

export function criarPagamento(payload) {
  return apiJson("/pagamentos", { method: "POST", body: payload });
}

export function listPagamentos() {
  return apiJson("/pagamentos");
}

export function listEnderecos() {
  return apiJson("/enderecos");
}

export function criarEndereco(payload) {
  return apiJson("/enderecos", { method: "POST", body: payload });
}

export function deletarEndereco(id) {
  return apiFetch(`/enderecos/${id}`, { method: "DELETE" });
}

export function deletarPedido(id) {
  return apiFetch(`/pedidos/${id}`, { method: "DELETE" });
}
