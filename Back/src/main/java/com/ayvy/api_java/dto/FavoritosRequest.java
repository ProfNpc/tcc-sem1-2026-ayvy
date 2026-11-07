package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Corpo do POST /favoritos: usuarioId e produtoId.
 */
@Getter
@Setter
public class FavoritosRequest {
    private Integer usuarioId;
    private Integer produtoId;
}
