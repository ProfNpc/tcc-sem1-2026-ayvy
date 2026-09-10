package com.ayvy.api_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CheckoutRequest {
private Integer usuarioId;
private String observacao;
private EnderecoEntregaRequest enderecoEntrega;
private List<ItemCarrinhoRequest> itens;


    @Getter
    @Setter
    public static class EnderecoEntregaRequest {
        private String logradouro;
        private String numero;
        private String complemento;
        private String bairro;
        private String cidade;
        private String uf;
        private String cep;
    }

    @Getter
    @Setter
    public static class ItemCarrinhoRequest {
        private Integer produtoId;
        private Integer quantidade;
    }
}
