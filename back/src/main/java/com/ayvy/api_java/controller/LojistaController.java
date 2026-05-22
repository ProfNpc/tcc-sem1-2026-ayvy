package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.LojistaService;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lojistas")

public class LojistaController {

    private final LojistaService lojistaService;

    public LojistaController(LojistaService lojistaService) {
        this.lojistaService = lojistaService;
    }

    @PostMapping
    public ResponseEntity<Void> salvarLojista(@RequestBody Lojista lojista) {
        lojistaService.salvarLojista(lojista);
        return ResponseEntity.ok().build();
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
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity <Lojista> atualizarLojistaPorId(@PathVariable Integer id,
                                                          @RequestBody Lojista lojista) {
        lojistaService.atualizarLojistaPorId(id, lojista);
        return ResponseEntity.ok().build();
    }


}
