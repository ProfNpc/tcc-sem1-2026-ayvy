package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.LojistaService;
import com.ayvy.api_java.dto.LojistaCreateRequest;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rotas de /lojistas: dados da loja (nome, slug, CNPJ, logo, banner, sigla). Criado depois do POST /usuarios.
 * Front: authApi.criarLojista (Cadastro), shopApi.loadShopsFromApi (vitrine) e adminApi (painel). Regras: LojistaService.
 */
@RestController
@RequestMapping("/lojistas")
public class LojistaController {

    private final LojistaService lojistaService;

    public LojistaController(LojistaService lojistaService) {
        this.lojistaService = lojistaService;
    }

    @PostMapping
    public ResponseEntity<Lojista> salvarLojista(@RequestBody LojistaCreateRequest request) {
        Lojista lojista = lojistaService.salvarLojista(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(lojista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lojista> buscarLojistaPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(lojistaService.buscarLojistaPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Lojista>> buscarLojistas() {
        return ResponseEntity.ok(lojistaService.listarLojistas());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarLojistaPorId(@PathVariable Integer id) {
        lojistaService.deletarLojistaPorId(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lojista> atualizarLojistaPorId(
            @PathVariable Integer id,
            @RequestBody Lojista lojista
    ) {
        return ResponseEntity.ok(lojistaService.atualizarLojistaPorId(id, lojista));
    }
}
