package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Corpo do POST /lojistas (2º passo do cadastro): usuarioId, nome da loja, slug, CNPJ, logo, banner e descrição.
 */
@Getter
@Setter
public class LojistaCreateRequest {

    private Integer usuarioId;
    private String nomeLoja;
    private String slug;
    private String cnpj;
    private String bannerUrl;
    private String logoUrl;
    private String descricao;
}
