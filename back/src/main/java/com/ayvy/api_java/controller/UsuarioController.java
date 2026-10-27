package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.RecuperacaoSenhaService;
import com.ayvy.api_java.business.UsuarioService;
import com.ayvy.api_java.dto.RecuperarSenhaRequest;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ayvy.api_java.dto.LoginRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final RecuperacaoSenhaService recuperacaoSenhaService;

    public UsuarioController(UsuarioService usuarioService, RecuperacaoSenhaService recuperacaoSenhaService) {
        this.usuarioService = usuarioService;
        this.recuperacaoSenhaService = recuperacaoSenhaService;
    }

    @PostMapping("/recuperar-senha")
    public ResponseEntity<Map<String, String>> recuperarSenha(@RequestBody RecuperarSenhaRequest request) {
        recuperacaoSenhaService.solicitarCodigo(request.getEmail(), request.getCanal());
        return ResponseEntity.ok(Map.of("mensagem", "sms".equalsIgnoreCase(request.getCanal())
                ? "Se houver uma conta com esse e-mail, enviamos o código por SMS para o telefone cadastrado (ou por e-mail, se não houver telefone)."
                : "Se houver uma conta com esse e-mail, enviamos um código para redefinir a senha."));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(@RequestBody RecuperarSenhaRequest request) {
        recuperacaoSenhaService.redefinirSenha(request.getEmail(), request.getCodigo(), request.getNovaSenha());
        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso."));
    }

    @PostMapping
    public ResponseEntity<Usuario> salvarUsuario(@RequestBody Usuario usuario) {
        Usuario salvo = usuarioService.salvarUsuario(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PostMapping("/login")
    public ResponseEntity<Usuario> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(usuarioService.autenticar(request.getEmail(), request.getSenha()));
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
        return ResponseEntity.ok(usuarioService.buscarUsuarioPorStatus(status));
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
