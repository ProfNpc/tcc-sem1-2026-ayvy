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

    public List<Notificacoes> buscarNotificacoesPorTituloOuMensagem(String titulo, String mensagem) {
        boolean temTitulo = titulo != null && !titulo.isBlank();
        boolean temMensagem = mensagem != null && !mensagem.isBlank();

        if (temTitulo && temMensagem) {
            return repository.findByTituloOrMensagem(titulo, mensagem);
        } else if (temTitulo) {
            return repository.findByTitulo(titulo);
        } else if (temMensagem) {
            return repository.findByMensagem(mensagem);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe ao menos 'titulo' ou 'mensagem' para buscar");
        }
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
        // `lida` é byte primitivo no entity — sempre atualiza quando o campo vem no body
        notificacoesEntity.setLida(notificacoes.getLida());

        repository.saveAndFlush(notificacoesEntity);
        return "Notificação Editada";
    }
}
