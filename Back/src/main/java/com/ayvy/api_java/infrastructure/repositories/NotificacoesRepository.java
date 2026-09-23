package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificacoesRepository extends JpaRepository<Notificacoes, Integer> {
    List<Notificacoes> findByTituloOrMensagem(String titulo, String mensagem);
    List<Notificacoes> findByTitulo(String titulo);
    List<Notificacoes> findByMensagem(String mensagem);
}
