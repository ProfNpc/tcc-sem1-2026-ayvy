package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProdutoVariacaoRequest {
    private String tamanho;
    private String cor;
    private Integer estoque;
}
