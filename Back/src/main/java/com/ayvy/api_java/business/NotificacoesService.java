package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import com.ayvy.api_java.infrastructure.repositories.NotificacoesRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificacoesService {

    private final NotificacoesRepository repository;

    public NotificacoesService(NotificacoesRepository repository) {
        this.repository = repository;
    }

    public String salvarNotificacoes(Notificacoes notificacoes) {
        repository.saveAndFlush(notificacoes);
        return "Notificacoes Enviada";
    }

    public Notificacoes buscarNotificacoesPorTituloOuMensagem(String titulo, String mensagem) {
        return repository.findByTituloOrMensagem(titulo, mensagem).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "notificação não encontrada")
        );
    }

    public List<Notificacoes> listarNotificacoes() {
        return repository.findAll();
    }

    public String deletarNotificacoesPorId(Integer id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada");
        }
        repository.deleteById(id);
        return "Notificacoes Apagada";
    }

    public String atualizarNotificacoesPorId(Integer id, Notificacoes notificacoes) {
        Notificacoes notificacoesEntity = repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada")
        );

        if (notificacoes.getMensagem() != null) {
            notificacoesEntity.setMensagem(notificacoes.getMensagem());
        }
        if (notificacoes.getTitulo() != null) {
            notificacoesEntity.setTitulo(notificacoes.getTitulo());
        }
        if (notificacoes.getTipo() != null) {
            notificacoesEntity.setTipo(notificacoes.getTipo());
        }
        if (notificacoes.getLida() != null) {
            notificacoesEntity.setLida(notificacoes.getLida());
        }

        repository.saveAndFlush(notificacoesEntity);
        return "Notificação Editada";
    }
}
