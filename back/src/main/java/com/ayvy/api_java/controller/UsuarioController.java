package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.UsuarioService;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<Usuario> salvarUsuario(@RequestBody Usuario usuario) {
        Usuario salvo = usuarioService.salvarUsuario(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.buscarUsuarioPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {

        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Usuario>> buscarUsuarioPorStatus(@PathVariable StatusUsuario status) {
        return ResponseEntity.ok(usuarioService.buscarPorStatus(status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Integer id) {
        usuarioService.deletarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    //EXCLUSÃO LÓGICA
    @PutMapping("/{id}/desativar")
    public ResponseEntity<Usuario> desativarUsuario(@PathVariable Integer id) {
        usuarioService.desativarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizarUsuarioPorId(
            @PathVariable Integer id,
            @RequestBody Usuario usuario
    ) {
        return ResponseEntity.ok(usuarioService.atualizarUsuarioPorId(id, usuario));
    }
}
