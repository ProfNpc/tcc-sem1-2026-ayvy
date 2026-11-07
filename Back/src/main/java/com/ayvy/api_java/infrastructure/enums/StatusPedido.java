package com.ayvy.api_java.infrastructure.enums;

/**
 * Status do pedido. Fluxo normal: aguardando_pagamento → pago → em_separacao → enviado → entregue.
 * cancelado/reembolsado devolvem as peças ao estoque (PedidoService.atualizarStatus).
 */
public enum StatusPedido {
    aguardando_pagamento,
    pago,
    em_separacao,
    enviado,
    entregue,
    cancelado,
    reembolsado
}
