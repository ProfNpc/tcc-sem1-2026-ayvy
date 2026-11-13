/**
 * Variações do produto (tamanho + cor + estoque): agora o estoque é guardado por variação.
 * Rotas /produtos/{id}/variacoes (ProdutoVariacaoController no back).
 * Usado por: Checkout (descobrir o produtoVariacaoId), Cadastro de produto (criar/editar opções),
 * Meu estoque (planilha) e página do Produto (o que está disponível).
 */
import { apiFetch, apiJson } from "./api";

export function listarVariacoes(produtoId) {
  return apiJson(`/produtos/${produtoId}/variacoes`);
}

export function listarVariacoesAtivas(produtoId) {
  return apiJson(`/produtos/${produtoId}/variacoes/ativas`);
}

export function criarVariacao(produtoId, { tamanho, cor, estoque }) {
  return apiJson(`/produtos/${produtoId}/variacoes`, { method: "POST", body: { tamanho, cor, estoque } });
}

export function atualizarVariacao(produtoId, variacaoId, { tamanho, cor, estoque }) {
  return apiJson(`/produtos/${produtoId}/variacoes/${variacaoId}`, {
    method: "PUT",
    body: { tamanho, cor, estoque },
  });
}

export function desativarVariacao(produtoId, variacaoId) {
  return apiFetch(`/produtos/${produtoId}/variacoes/${variacaoId}/desativar`, { method: "PATCH" });
}

export function ativarVariacao(produtoId, variacaoId) {
  return apiFetch(`/produtos/${produtoId}/variacoes/${variacaoId}/ativar`, { method: "PATCH" });
}

function igual(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

/**
 * Acha a variação pela cor e tamanho escolhidos pelo cliente. Se o produto só tem uma opção
 * (ou só uma cor / um tamanho), o que faltar é preenchido sozinho.
 */
export function acharVariacao(variacoes, cor, tamanho) {
  const lista = variacoes || [];
  const candidatas = lista.filter(
    (v) => (!cor || igual(v.cor, cor)) && (!tamanho || igual(v.tamanho, tamanho)),
  );
  if (cor && tamanho) return candidatas[0] || null;
  return candidatas.length === 1 ? candidatas[0] : null;
}
