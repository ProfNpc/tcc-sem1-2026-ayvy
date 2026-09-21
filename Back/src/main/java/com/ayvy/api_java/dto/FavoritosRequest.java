package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FavoritosRequest {
    private Integer usuarioId;
    private Integer produtoId;
}
