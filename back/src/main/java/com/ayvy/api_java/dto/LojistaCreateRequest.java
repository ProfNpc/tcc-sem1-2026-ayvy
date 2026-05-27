package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

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
