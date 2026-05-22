package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.EnderecoService;
import com.ayvy.api_java.infrastructure.entities.Endereco;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enderecos")

public class EnderecoController {

    private final  EnderecoService enderecoService;

    public EnderecoController(EnderecoService enderecoService) {this.enderecoService = enderecoService;}

    @PostMapping
    public ResponseEntity<Void> salvarEndereco(@RequestBody Endereco endereco) {
        enderecoService.salvarEndereco(endereco);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Endereco> buscarEnderecoPorId(@PathVariable Long id) {
        return ResponseEntity.ok(enderecoService.buscarEnderecoPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Endereco>> listarEnderecos() {
        return ResponseEntity.ok(enderecoService.listarEnderecos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarEnderecoPorId(@PathVariable Long id) {
        enderecoService.deletarEnderecoPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarEnderecoPorId(@PathVariable Long id,
                                                        @RequestBody Endereco endereco){
        enderecoService.atualizarEnderecoPorId(id, endereco);
        return ResponseEntity.ok().build();
    }

}
