package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Corpo do POST /usuarios/login: e-mail e senha.
 */
@Getter
@Setter
public class LoginRequest {
    private String email;
    private String senha;
}