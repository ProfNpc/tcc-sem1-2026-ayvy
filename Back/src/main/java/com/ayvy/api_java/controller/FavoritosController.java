package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.FavoritosService;
import com.ayvy.api_java.dto.FavoritosRequest;
import com.ayvy.api_java.infrastructure.entities.Favoritos;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/favoritos")
public class FavoritosController {

    private final FavoritosService favoritosService;

    public FavoritosController(FavoritosService favoritosService) {
        this.favoritosService = favoritosService;
    }

    @PostMapping
    public ResponseEntity<Favoritos> favoritar(@RequestBody FavoritosRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(favoritosService.favoritar(request));
    }

    @DeleteMapping
    public ResponseEntity<Void> desfavoritar(@RequestParam Integer usuarioId, @RequestParam Integer produtoId) {
        favoritosService.desfavoritar(usuarioId, produtoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Favoritos>> listarPorUsuario(@RequestParam Integer usuarioId) {
        return ResponseEntity.ok(favoritosService.listarPorUsuario(usuarioId));
    }

    @GetMapping("/verificar")
    public ResponseEntity<Boolean> favorito(@RequestParam Integer usuarioId, @RequestParam Integer produtoId) {
        return ResponseEntity.ok(favoritosService.favorito(usuarioId, produtoId));
    }
}
