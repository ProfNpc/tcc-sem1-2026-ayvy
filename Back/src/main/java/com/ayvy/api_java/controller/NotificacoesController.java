package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.NotificacoesService;
import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


/**
 * Rotas de /notificacoes: avisos do usuário (marcar como lida, excluir).
 * As notificações de pedido são criadas pelo PedidoService (tipos: pedido, pedido_loja, pedido_admin).
 * Front: notificacoesApi.js (tela Notificações, aviso no card da Loja e "Atividade recente" do admin).
 */
@RestController
@RequestMapping("/notificacoes")

public class NotificacoesController {

    private final NotificacoesService notificacoesService;

    public NotificacoesController(NotificacoesService notificacoesService) {this.notificacoesService = notificacoesService;}

    @PostMapping
    public ResponseEntity<Void> salvarNotificacoes(@RequestBody Notificacoes notificacoes){
        notificacoesService.salvarNotificacoes(notificacoes);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Notificacoes>> buscarNotificacoesPorTituloOuMensagem(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String mensagem) {
        return ResponseEntity.ok(notificacoesService.buscarNotificacoesPorTituloOuMensagem(titulo, mensagem));
    }

    @GetMapping
    public ResponseEntity <List<Notificacoes>> listarNotificacoes(){
        return ResponseEntity.ok(notificacoesService.listarNotificacoes());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarNotificacoesPorId(@PathVariable Integer id){
        notificacoesService.deletarNotificacoesPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarNotificacoesPorId(@PathVariable Integer id,
                                                       @RequestBody Notificacoes mensagem){
        notificacoesService.atualizarNotificacoesPorId(id, mensagem);
        return ResponseEntity.ok().build();
    }

}
