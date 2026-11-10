package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.EstoqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Rota de /estoque/relatorio (tela "Meu estoque" do lojista): vendas e devoluções por mês.
 * A planilha de estoque (quantidade por tamanho e cor) é feita em /produtos/{produtoId}/variacoes
 * (ProdutoVariacaoController). Regras do relatório: EstoqueService.
 */
@RestController
@RequestMapping("/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @GetMapping("/relatorio")
    public ResponseEntity<EstoqueService.Relatorio> relatorio(@RequestParam Integer lojistaId) {
        return ResponseEntity.ok(estoqueService.relatorio(lojistaId));
    }
}