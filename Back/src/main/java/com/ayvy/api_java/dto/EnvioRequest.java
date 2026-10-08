package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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
