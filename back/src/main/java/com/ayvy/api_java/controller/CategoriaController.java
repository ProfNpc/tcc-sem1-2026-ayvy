package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.CategoriaService;
import com.ayvy.api_java.infrastructure.entities.Categoria;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rotas de /categorias: lista a árvore (cada categoria traz categoriaPai, icone e ordem) e CRUD do admin.
 * Front: categoriasApi.js (tela /categorias), lojistaApi.listCategorias (cadastro de produto), adminApi.js.
 * A árvore padrão é criada por config/CategoriaArvoreBootstrap.
 */
@RestController
@RequestMapping("/categorias")

public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {this.categoriaService = categoriaService;}

    @PostMapping
    public ResponseEntity<Void> salvarCategoria(@RequestBody Categoria categoria) {
        categoriaService.salvarCategoria(categoria);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{nome}")
    public ResponseEntity<Categoria> buscarCategoriaPorNome(@PathVariable String nome) {
        return ResponseEntity.ok(categoriaService.buscarCategoriaPorNome(nome));
    }

    @GetMapping
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaService.listarCategorias());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarCategoriaPorId(@PathVariable Integer id) {
        categoriaService.deletarCategoriaPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarCategoriaPorId(@PathVariable Integer id,
                                                        @RequestBody Categoria categoria){
        categoriaService.atualizarCategoriaPorId(id, categoria);
        return ResponseEntity.ok().build();
    }

}
