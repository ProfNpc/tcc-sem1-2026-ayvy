package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.MensagemService;
import com.ayvy.api_java.infrastructure.entities.Mensagem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//????????????????????? USAREMOS ISSO COMO ENTIDADE? ???????????????

@RestController
@RequestMapping("/mensagens")

public class MensagemController {

    private final MensagemService mensagemService;

    public MensagemController(MensagemService mensagemService) {this.mensagemService = mensagemService;}

    @PostMapping
    public ResponseEntity<Void> salvarMensagem(@RequestBody Mensagem mensagem){
        mensagemService.salvarMensagem(mensagem);
        return ResponseEntity.ok().build();
    }

    //CORRIGIR FORMA DE BUSCAR, É COM 1 OU DOIS?
    @GetMapping("/{texto}")
    public ResponseEntity<Mensagem> buscarMensagemPorTextoOuNome(@PathVariable String texto, String nome){
        return ResponseEntity.ok(mensagemService.buscarMensagemPorTextoOuNome(texto, nome));
    }

    @GetMapping
    public ResponseEntity <List<Mensagem>> listarMensagens(){
        return ResponseEntity.ok(mensagemService.listarMensagens());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMensagemPorId(@PathVariable Integer id){
        mensagemService.deletarMensagemPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarMensagemPorId(@PathVariable Integer id,
                                                       @RequestBody Mensagem mensagem){
        mensagemService.atualizarMensagemPorId(id, mensagem);
        return ResponseEntity.ok().build();
    }

}
