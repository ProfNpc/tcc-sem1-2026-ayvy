package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.EstoqueService;
import com.ayvy.api_java.dto.EstoqueItemRequest;
import com.ayvy.api_java.infrastructure.entities.EstoqueItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rotas de /estoque ("Meu estoque" do lojista): planilha (listar, criar, adicionar, editar, remover)
 * e relatório de vendas/devoluções por mês.
 * Front: ayvy-react/src/services/estoqueApi.js (tela /meu-estoque). Regras: EstoqueService.
 */
@RestController
@RequestMapping("/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @GetMapping
    public ResponseEntity<List<EstoqueItem>> listar(@RequestParam Integer lojistaId) {
        return ResponseEntity.ok(estoqueService.listar(lojistaId));
    }

    @PostMapping("/planilha")
    public ResponseEntity<List<EstoqueItem>> criarPlanilha(@RequestParam Integer lojistaId) {
        return ResponseEntity.ok(estoqueService.criarPlanilha(lojistaId));
    }

    @PostMapping
    public ResponseEntity<EstoqueItem> adicionar(@RequestBody EstoqueItemRequest request) {
        return ResponseEntity.ok(estoqueService.adicionar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstoqueItem> atualizar(@PathVariable Integer id, @RequestBody EstoqueItemRequest request) {
        return ResponseEntity.ok(estoqueService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Integer id) {
        estoqueService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/relatorio")
    public ResponseEntity<EstoqueService.Relatorio> relatorio(@RequestParam Integer lojistaId) {
        return ResponseEntity.ok(estoqueService.relatorio(lojistaId));
    }
}
