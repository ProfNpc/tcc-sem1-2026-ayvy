package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Favoritos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoritosRepository extends JpaRepository<Favoritos, Integer> {
    List<Favoritos> findByUsuarioId(Integer usuarioId);
    Optional<Favoritos> findByUsuarioIdAndProdutoId(Integer usuarioId, Integer produtoId);
}
