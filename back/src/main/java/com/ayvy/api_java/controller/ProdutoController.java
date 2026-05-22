package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.ProdutoService;
import com.ayvy.api_java.dto.ProdutoImagemRequest;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.ProdutoImagem;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @PostMapping
    public ResponseEntity<Produto> salvarProduto(@RequestBody Produto produto) {
        Produto salvo = produtoService.salvarProduto(produto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarProdutoPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(produtoService.buscarProdutoPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Produto>> listarProdutos() {
        return ResponseEntity.ok(produtoService.listarProdutos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarProdutoPorId(@PathVariable Integer id) {
        produtoService.deletarProdutoPorId(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizarProdutoPorId(
            @PathVariable Integer id,
            @RequestBody Produto produto
    ) {
        return ResponseEntity.ok(produtoService.atualizarProdutoPorId(id, produto));
    }

    @PostMapping("/{id}/imagens")
    public ResponseEntity<ProdutoImagem> adicionarImagem(
            @PathVariable Integer id,
            @RequestBody ProdutoImagemRequest request
    ) {
        ProdutoImagem imagem = produtoService.adicionarImagem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(imagem);
    }

    @GetMapping("/{id}/imagens")
    public ResponseEntity<List<ProdutoImagem>> listarImagens(@PathVariable Integer id) {
        return ResponseEntity.ok(produtoService.listarImagensProduto(id));
    }
}
