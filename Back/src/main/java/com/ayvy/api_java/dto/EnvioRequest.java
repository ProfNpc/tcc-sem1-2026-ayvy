package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Corpo do PUT /pedidos/{id}/envio: local da postagem, transportadora, código de rastreio, previsão e observação.
 */
@Getter
@Setter
public class EnvioRequest {

    private String localPostagem;
    private String transportadora;
    private String codigoRastreio;
    private LocalDate previsaoEntrega;
    private String observacaoEnvio;
    private Integer actorUsuarioId;
}
