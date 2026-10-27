package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecuperarSenhaRequest {
    private String email;
    /** "email" (padrão) ou "sms" */
    private String canal;
    private String codigo;
    private String novaSenha;
}
