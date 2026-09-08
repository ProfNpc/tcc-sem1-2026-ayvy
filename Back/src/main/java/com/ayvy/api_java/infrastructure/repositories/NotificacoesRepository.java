package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificacoesRepository extends JpaRepository<Notificacoes, Integer> {

    //Isso vai chamar um ou outro OU vai ser obrigatório os DOIS ao mesmo tempo?
    Optional<Notificacoes> findByTituloOrMensagem(String titulo, String mensagem);
}
