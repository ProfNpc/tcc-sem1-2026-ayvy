package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.UsuarioService;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")

public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<Void> salvarUsuario(@RequestBody Usuario usuario) {
        usuarioService.salvarUsuario(usuario);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.buscarUsuarioPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Integer id) {
        usuarioService.deletarUsuario(id);
        return ResponseEntity.ok().build();
    }

    //Adicionar para retornar o Usuario Atualizado
    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarUsuarioPorId(@PathVariable Integer id,
                                                    @RequestBody Usuario usuario) {
        usuarioService.atualizarUsuarioPorId(id, usuario);
        return ResponseEntity.ok().build();
    }

}
