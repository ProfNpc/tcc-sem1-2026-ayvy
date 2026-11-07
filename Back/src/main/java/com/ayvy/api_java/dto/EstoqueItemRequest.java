package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EstoqueItemRequest {
    private Integer lojistaId;
    private Integer produtoId;
    /** Tamanho ou numeração (ex.: "M", "38"). Vazio = todos os tamanhos juntos. */
    private String tamanho;
    private Integer quantidade;
}
