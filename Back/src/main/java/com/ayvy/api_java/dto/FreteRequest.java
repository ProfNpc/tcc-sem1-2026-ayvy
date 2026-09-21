package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FreteRequest {

    private String cepDestino;
    private List<ItemFreteRequest> itens;

    @Getter
    @Setter
    public static class ItemFreteRequest {
        private Integer produtoId;
    }
}
