package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LojistaRepository extends JpaRepository<Lojista, Integer> {

    java.util.Optional<Lojista> findByUsuario_Id(Integer usuarioId);

    Optional<Lojista> findBySlug(String slug);
}
