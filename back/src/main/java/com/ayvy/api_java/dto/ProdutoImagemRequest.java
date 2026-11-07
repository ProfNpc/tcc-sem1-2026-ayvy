package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Corpo do POST /produtos/{id}/imagens: caminho /uploads/... e ordem da foto.
 */
@Getter
@Setter
public class ProdutoImagemRequest {

    private String caminho;
    private Short ordem;
}
