package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.ProdutoVariacaoService;
import com.ayvy.api_java.dto.ProdutoVariacaoRequest;
import com.ayvy.api_java.dto.ProdutoVariacaoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produtos/{produtoId}/variacoes")
public class ProdutoVariacaoController {

    private final ProdutoVariacaoService variacaoService;

    public ProdutoVariacaoController(ProdutoVariacaoService variacaoService) {
        this.variacaoService = variacaoService;
    }

    //listar todas as variaçoes
    @GetMapping
    public ResponseEntity<List<ProdutoVariacaoResponse>> listarVariacoes(@PathVariable Integer produtoId) {
        return ResponseEntity.ok(variacaoService.listarVariacoes(produtoId));
    }

    //listar somente ativas
    @GetMapping("/ativas")
    public ResponseEntity<List<ProdutoVariacaoResponse>> buscarVariacoesAtivas(@PathVariable Integer produtoId) {
        return ResponseEntity.ok(variacaoService.listarVariacoesAtivas(produtoId));
    }

    //criar variacao
    @PostMapping
    public ResponseEntity<ProdutoVariacaoResponse> criarVariacao(@PathVariable Integer produtoId,
                                                                 @RequestBody ProdutoVariacaoRequest request) {
        ProdutoVariacaoResponse resposta = variacaoService.criarVariacao(produtoId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    //Update da variação
    @PutMapping("/{variacaoId}")
    public ResponseEntity<ProdutoVariacaoResponse> atualizarVariacao(
            @PathVariable Integer produtoId,
            @PathVariable Integer variacaoId,
            @RequestBody ProdutoVariacaoRequest request
    ) {
        return ResponseEntity.ok(variacaoService.atualizarVariacao(produtoId, variacaoId, request));
    }

    //desativar variação
    @PatchMapping("/{variacaoId}/desativar")
    public ResponseEntity<Void> desativarVariacao(
            @PathVariable Integer produtoId,
            @PathVariable Integer variacaoId
    ){
        variacaoService.desativarVariacao(produtoId, variacaoId);

        return ResponseEntity.noContent().build();
    }

    //Ativar variação
    @PatchMapping("/variacaoId}/ativar")
    public ResponseEntity<Void> ativarVariacao(
            @PathVariable Integer produtoId,
            @PathVariable Integer variacaoId
    ){
        variacaoService.ativarVariacao(produtoId, variacaoId);

        return ResponseEntity.noContent().build();
    }
}
