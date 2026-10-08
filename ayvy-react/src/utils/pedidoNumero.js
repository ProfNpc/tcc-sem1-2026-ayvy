/**
 * Código do pedido mostrado ao usuário: sigla da loja + sequência dentro da loja (#LU-1, #LU-2...).
 * Pedidos com itens de várias lojas mostram um código por loja.
 */
export function numeroPedidoLabel(itens, pedidoId) {
  const codigos = [
    ...new Set((itens || []).map((i) => i?.codigoPedidoLoja).filter(Boolean)),
  ];
  return codigos.length ? codigos.map((c) => `#${c}`).join(", ") : `#${pedidoId}`;
}
