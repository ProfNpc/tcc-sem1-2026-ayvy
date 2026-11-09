package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Corpo do POST /visualizacoes: produtoId e usuarioId (opcional).
 */
@Getter
@Setter
public class VisualizacoesRequest {
    private Integer usuarioId;
    private Integer produtoId;
}
