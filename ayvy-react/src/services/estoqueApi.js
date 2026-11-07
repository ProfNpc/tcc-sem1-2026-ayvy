/**
 * "Meu estoque" do lojista (tela /meu-estoque).
 * Planilha: GET/POST/PUT/DELETE /estoque e POST /estoque/planilha (cria a partir dos produtos da loja).
 * Relatório de vendas e devoluções por mês: GET /estoque/relatorio.
 * Back: EstoqueController → EstoqueService (também chamado pelo checkout e pelo cancelamento/reembolso).
 */
import { apiFetch, apiJson } from "./api";

export function listarEstoque(lojistaId) {
  return apiJson(`/estoque?lojistaId=${encodeURIComponent(lojistaId)}`);
}

export function criarPlanilhaEstoque(lojistaId) {
  return apiJson(`/estoque/planilha?lojistaId=${encodeURIComponent(lojistaId)}`, { method: "POST" });
}

export function adicionarAoEstoque({ lojistaId, produtoId, tamanho, quantidade }) {
  return apiJson("/estoque", {
    method: "POST",
    body: { lojistaId, produtoId, tamanho: tamanho || null, quantidade },
  });
}

export function atualizarLinhaEstoque(id, { quantidade, tamanho }) {
  return apiJson(`/estoque/${id}`, { method: "PUT", body: { quantidade, tamanho } });
}

export function removerLinhaEstoque(id) {
  return apiFetch(`/estoque/${id}`, { method: "DELETE" });
}

export function relatorioEstoque(lojistaId) {
  return apiJson(`/estoque/relatorio?lojistaId=${encodeURIComponent(lojistaId)}`);
}
