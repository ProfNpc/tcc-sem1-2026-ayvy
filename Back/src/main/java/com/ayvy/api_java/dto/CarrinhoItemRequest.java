package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Linha do carrinho enviada no PUT /carrinho: produtoId, quantidade, cor e tamanho.
 */
@Getter
@Setter
public class CarrinhoItemRequest {
    private Integer produtoId;
    private Integer quantidade;
    private String cor;
    private String tamanho;
    private Integer produtoVariacaoId;
}
