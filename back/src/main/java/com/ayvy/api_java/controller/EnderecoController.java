package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.EnderecoService;
import com.ayvy.api_java.infrastructure.entities.Endereco;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enderecos")
public class EnderecoController {

    private final EnderecoService enderecoService;

    public EnderecoController(EnderecoService enderecoService) {
        this.enderecoService = enderecoService;
    }

    @PostMapping
    public ResponseEntity<Endereco> salvarEndereco(@RequestBody Endereco endereco) {
        return ResponseEntity.ok(enderecoService.salvarEndereco(endereco));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Endereco> buscarEnderecoPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(enderecoService.buscarEnderecoPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Endereco>> listarEnderecos() {
        return ResponseEntity.ok(enderecoService.listarEnderecos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarEnderecoPorId(@PathVariable Integer id) {
        enderecoService.deletarEnderecoPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Endereco> atualizarEnderecoPorId(
            @PathVariable Integer id,
            @RequestBody Endereco endereco
    ) {
        return ResponseEntity.ok(enderecoService.atualizarEnderecoPorId(id, endereco));
    }
}
