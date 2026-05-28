package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MensagemRepository extends JpaRepository<Mensagem, Integer> {

    //Isso vai chamar um ou outro OU vai ser obrigatório os DOIS ao mesmo tempo?
    Optional<Mensagem> findByTextoOrNome(String texto, String nome);
}
