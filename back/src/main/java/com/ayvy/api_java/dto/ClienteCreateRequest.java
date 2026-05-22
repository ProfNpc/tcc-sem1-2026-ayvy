package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ClienteCreateRequest {

    private Integer usuarioId;
    private String cpf;
    private LocalDate dataNascimento;
}
