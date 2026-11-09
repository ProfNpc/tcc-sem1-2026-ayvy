package com.ayvy.api_java.dto;

import com.ayvy.api_java.infrastructure.entities.ProdutoVariacao;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProdutoVariacaoResponse {
    private Integer id;
    private Integer produtoId;
    private String tamanho;
    private String cor;
    private Integer estoque;
    private boolean ativo;

    public static ProdutoVariacaoResponse fromEntity(ProdutoVariacao variacao) {
        ProdutoVariacaoResponse response = new ProdutoVariacaoResponse();

        response.setId(variacao.getId());
        response.setProdutoId(variacao.getProduto().getId());
        response.setTamanho(variacao.getTamanho());
        response.setCor(variacao.getCor());
        response.setEstoque(variacao.getEstoque());
        response.setAtivo(variacao.isAtivo());

        return response;
    }
}
