package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.VisualizacoesProdutoService;
import com.ayvy.api_java.dto.VisualizacoesRequest;
import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/visualizacoes")
public class VisualizacoesProdutoController {

    private final VisualizacoesProdutoService service;

    public VisualizacoesProdutoController(VisualizacoesProdutoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@RequestBody VisualizacoesRequest request){
    service.registrarVisualizacao(request);
    return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/produto/{produtoId}/total")
    public ResponseEntity<Long> contarPorProduto(@PathVariable Integer produtoId){
        return ResponseEntity.ok(service.contarPorProduto(produtoId));
    }

}
