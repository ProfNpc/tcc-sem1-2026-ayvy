package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.ProdutoService;
import com.ayvy.api_java.infrastructure.entities.Produto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
//A uri:
//Vai fazer requisições pela 'localhost:8080/cliente'
@RequestMapping("/produtos")

public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }
    //Para gravar dados:
    @PostMapping
    public ResponseEntity<Void> salvarCliente(@RequestBody Produto produto) {  //Necessário alterar para DTO
        produtoService.salvarProduto(produto);
        return ResponseEntity.ok().build();
    }

    //@RequestParam --> vai pedir depois de um '?', AGORA o @PathVariable --> vai integrar ao caminho com '/'
    //Para buscar:
    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarProdutoPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(produtoService.buscarProdutoPorId(id));
    }

    //Retornar lista de todos *!
    @GetMapping
    public ResponseEntity <List<Produto>> listarProdutos() {
        return ResponseEntity.ok(produtoService.listarProdutos());

    }

    //Para deletar:
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarProdutoPorId(@PathVariable Integer id){
        produtoService.deletarProdutoPorId(id);
        return ResponseEntity.ok().build();
    }

    //Fazer alterações em TODOS os campos:
    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarProdutoPorId(@PathVariable Integer id,
                                                      @RequestBody Produto produto){
        produtoService.atualizarProdutoPorId(id, produto);
        return ResponseEntity.ok().build();
    }
}




