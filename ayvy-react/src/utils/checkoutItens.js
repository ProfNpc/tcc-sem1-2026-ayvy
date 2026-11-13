import { acharVariacao, listarVariacoesAtivas } from "../services/variacoesApi";

/**
 * Converte o carrinho no formato do POST /pedidos/checkout: { produtoId, produtoVariacaoId, quantidade }.
 * O estoque agora é por variação (tamanho + cor), então cada linha precisa do id da variação escolhida.
 * Busca as variações ativas de cada produto (uma chamada por produto) e confere o estoque antes de enviar,
 * para mostrar uma mensagem clara em vez do erro genérico da API.
 */
export async function montarItensDoCheckout(cart) {
  const porProduto = new Map();
  for (const line of cart) {
    const produtoId = Number(line.apiId ?? line.productId);
    if (!porProduto.has(produtoId)) porProduto.set(produtoId, listarVariacoesAtivas(produtoId));
  }

  const itens = [];
  for (const line of cart) {
    const produtoId = Number(line.apiId ?? line.productId);
    const variacoes = await porProduto.get(produtoId);
    const rotulo = `${line.name}${[line.color, line.size].filter(Boolean).length ? ` (${[line.color, line.size].filter(Boolean).join(", ")})` : ""}`;
    const variacao = acharVariacao(variacoes, line.color, line.size);
    if (!variacao) {
      throw new Error(
        line.color || line.size
          ? `${rotulo} não está mais disponível nessa cor/tamanho. Volte ao carrinho e escolha outra opção.`
          : `Escolha a cor e o tamanho de ${line.name} no carrinho antes de finalizar.`,
      );
    }
    const quantidade = line.quantity || 1;
    if (variacao.estoque < quantidade) {
      throw new Error(
        variacao.estoque > 0
          ? `Só restam ${variacao.estoque} unidade(s) de ${rotulo}. Ajuste a quantidade no carrinho.`
          : `${rotulo} esgotou. Remova do carrinho ou escolha outra opção.`,
      );
    }
    itens.push({ produtoId, produtoVariacaoId: variacao.id, quantidade });
  }
  return itens;
}
