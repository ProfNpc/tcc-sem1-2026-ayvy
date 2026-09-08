package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import com.ayvy.api_java.infrastructure.repositories.NotificacoesRepository;
import org.springframework.stereotype.Service;

import java.util.List;


@Service

public class NotificacoesService {

    private final NotificacoesRepository repository;

    public NotificacoesService(NotificacoesRepository repository) {this.repository = repository;}

    //CREATE
    public String salvarNotificacoes(Notificacoes notificacoes){
        repository.saveAndFlush(notificacoes);
        return ("Notificacoes Enviada");
    }

    //READ
    public Notificacoes buscarNotificacoesPorTituloouMensagem(String titulo, String mensagem){
        return repository.findByTituloOrMensagem(titulo, mensagem).orElseThrow(
                () -> new RuntimeException("notificação não encontrada")
        );
    }

    public List<Notificacoes> listarMensagens(){
        return repository.findAll();
    }

    //DELETE - deixar histórico de notificações
//    public String deletarNotificacoesPorId(Integer id){
//        repository.deleteById(id);
//        return ("Notificacoes Apagada");
//    }

    //UPDATE - como funcionará esse esquema? apenas lojistas enviam notificações
    public String atualizarNotificacoesPorId(Integer id, Notificacoes notificacoes){
        Notificacoes notificacoesEntity = repository.findById(id).orElseThrow(
                () -> new RuntimeException("Notificacoes não encontrada")
        );

        if(notificacoes.getMensagem() != null){
        notificacoesEntity.setMensagem(notificacoes.getMensagem());}

       repository.saveAndFlush(notificacoesEntity);
        return ("Notificação Editada");
    }

  /* ========= ! FORMA ANTIGA ! =============================================
        //Talvez possamos reomear para 'editada' depois
        Notificacoes notificacoesAtualizada = Notificacoes.builder()
                .texto(notificacoes.getTexto() != null ?
                        notificacoes.getTexto() : notificacoesEntity.getTexto())
                .nome(notificacoesEntity.getNome())
                .dataEnvio(notificacoesEntity.getDataEnvio())
                .dataRecebimento(notificacoesEntity.getDataRecebimento())
                .id(notificacoesEntity.getId())
                .build();
    }*/
}
