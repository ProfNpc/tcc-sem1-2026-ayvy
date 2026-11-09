/**
 * Carrinho salvo na conta do cliente (o mesmo do app mobile/login-app).
 * GET /carrinho lê, PUT /carrinho substitui pelo carrinho inteiro. Back: CarrinhoController → CarrinhoService.
 * Usado por context/CartContext (sincroniza ao entrar, a cada mudança e quando a aba volta a ficar ativa).
 */
import { apiJson } from "./api";

export function buscarCarrinhoDaConta(usuarioId) {
  return apiJson(`/carrinho?usuarioId=${encodeURIComponent(usuarioId)}`);
}

export function salvarCarrinhoDaConta(usuarioId, itens) {
  return apiJson(`/carrinho?usuarioId=${encodeURIComponent(usuarioId)}`, { method: "PUT", body: itens });
}
