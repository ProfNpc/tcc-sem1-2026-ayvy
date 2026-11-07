package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Corpo do POST /clientes (2º passo do cadastro): usuarioId, CPF e data de nascimento.
 */
@Getter
@Setter
public class ClienteCreateRequest {

    private Integer usuarioId;
    private String cpf;
    private LocalDate dataNascimento;
}
