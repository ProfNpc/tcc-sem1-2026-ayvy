package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.CheckoutRequest;
import com.ayvy.api_java.infrastructure.entities.*;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import com.ayvy.api_java.infrastructure.repositories.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service

public class PedidoService {

    private final PedidoRepository repository;
    private final PedidoProdutosRepository pedidoProdutosRepository;

    public PedidoService(PedidoRepository repository) {this.repository = repository;
        this.pedidoProdutosRepository = pedidoProdutosRepository;
    }


    //CREATE
    public String salvarPedido(Pedido pedido){
        repository.saveAndFlush(pedido);
        return ("Pedido Confirmado!");
    }

    //READ
    public Pedido buscarPedidoPorId(Integer id){

        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado")
        );
    }

    public List<Pedido> listarPedidos(){
        return repository.findAll();
    }

    public PedidoEnderecoEntrega buscarEnderecoPorPedidoId(Integer pedidoId){
    return PedidoEnderecoEntregaRepository.findById(pedidoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Endereço de entrega não encontrado para o pedido " + pedidoId));
}

    public List<Pedido> listarPedidosPorUsuario(Integer usuarioId){
    return repository.findByUsuarioId(usuarioId);}
}

public List<PedidoProdutos> listarItensPorPedidoId(Integer pedidoId){
    buscarPedidoPorId(pedidoId);
    return pedidoProdutoRepository.findByPedidoId(pedidoId);
}

    //DELETE
    public String deletarPedidoPorId(Integer id){
        repository.deleteById(id);
        return ("pedido cancelado!");
    }

    // UPDATE DE STATUS
    public Pedido atualizarStatus(Integer id, StatusPedido novoStatus) {
        Pedido pedido = buscarPedidoPorId(id);
        pedido.setStatus(novoStatus);
        return repository.saveAndFlush(pedido);
    }

    @Transactional
    public Pedido finalizarCheckout(CheckoutRequest request) {
        Usuario usuario = UsuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario não encontrado"));

        BigDecimal subtotal = BigDecimal.ZERO;
        List<PedidoProdutos> itens = new ArrayList<>();

        for (var itemReq : request.getItens()) {
            Produto produto = ProdutoRepository.findById(itemReq.getProdutoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Produto " + itemReq.getProdutoId() + " não encontrado"));

            if (produto.getEstoque() < itemReq.getQuantidade()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Estoque insuficiente para " + produto.getNome());
            }

            produto.setEstoque(produto.getEstoque() - itemReq.getQuantidade());
            ProdutoRepository.save(produto);

            BigDecimal  precoUnit = produto.getPreco();
            subtotal = subtotal.add(precoUnit.multiply(BigDecimal.valueOf(itemReq.getQuantidade())));

            itens.add(PedidoProdutos.builder()
                    .produto(produto)
                    .lojista(produto.getLojista())
                    .quantidade(itemReq.getQuantidade())
                    .precoUnitario(precoUnit.doubleValue())
                    .build()
            );
        }
    Pedido pedido = Pedido.builder()
            .usuario(usuario)
            .observacao(request.getObservacao())
            .valorSubtotal(subtotal)
            .valorFrete(BigDecimal.ZERO) //ajustar quando tiver cálculo de frete!!!
            .valorTotal(subtotal)
            .status(StatusPedido.aguardando_pagamento)
            .build();

        pedido = repository.saveAndFlush(pedido);

        for (var item : itens) {
            item.setPedido(pedido);
            PedidoProdutosRepository.save(item);
        }

        var endereco = request.getEnderecoEntrega();
        PedidoEnderecoEntrega entrega = PedidoEnderecoEntrega.builder()
                .pedido(pedido)
                .logradouro(endereco.getLogradouro())
                .numero(endereco.getNumero())
                .complemento(endereco.getComplemento())
                .bairro(endereco.getBairro())
                .uf(endereco.getUf())
                .cep(endereco.getCep())
                .buld();
        PedidoEnderecoEntregaRepository.save(entrega);

    return pedido;

    //UPDATE
    // !!! Não será possível atualizar o Pedido uma vez feito
    // !!! Pórem PedidoAtualizado está aqui caso seja necessário no futuro
    /*
    public void atualizarPedidoPorId(Integer id, Pedido pedido){
        Pedido pedidoEntity = buscarPedidoPorId(id);

        Pedido pedidoAtualizado = Pedido.builder()
                .status(pedidoEntity.getStatus())
                .valor(pedidoEntity.getValor())
                .dataPedido(pedidoEntity.getDataPedido())
                .id(pedidoEntity.getId())
                .build();

        repository.saveAndFlush(pedidoAtualizado);
    }*/


}
