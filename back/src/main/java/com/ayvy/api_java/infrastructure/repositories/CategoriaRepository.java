package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    Optional<Categoria> findByNomeCategoria(String nomeCategoria);

}