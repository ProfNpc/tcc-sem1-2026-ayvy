package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.NotificacoesService;
import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//????????????????????? USAREMOS ISSO COMO ENTIDADE? ???????????????

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

    //CORRIGIR FORMA DE BUSCAR, É COM 1 OU DOIS?
    @GetMapping("/{titulo}")
    public ResponseEntity<Notificacoes> buscarNotificacoesPorTituloOuMensagem(@PathVariable String titulo, String mensagem){
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
