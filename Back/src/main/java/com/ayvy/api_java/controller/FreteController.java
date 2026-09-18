package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.FreteService;
import com.ayvy.api_java.dto.FreteRequest;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/frete")
public class FreteController {

    private final FreteService freteService;
    private final ProdutoRepository produtoRepository;

    public FreteController(FreteService freteService, ProdutoRepository produtoRepository) {
        this.freteService = freteService;
        this.produtoRepository = produtoRepository;
    }

    @PostMapping("/calcular")
    public ResponseEntity<BigDecimal> calcular(@RequestBody FreteRequest request){
        List<PedidoProdutos> itensFicticios = request.getItens().stream()
                .map(item -> {
                    Produto produto = produtoRepository.findById(item.getProdutoId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Produto " + item.getProdutoId() + " não encontrado"));
                    return PedidoProdutos.builder()
                            .produto(produto)
                            .lojista(produto.getLojista())
                            .build();
                })
                .toList();

        return ResponseEntity.ok(freteService.calcularFreteTotal(itensFicticios, request.getCepDestino()));
    }
}
