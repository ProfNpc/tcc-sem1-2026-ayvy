package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.RedefinicaoSenha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RedefinicaoSenhaRepository extends JpaRepository<RedefinicaoSenha, Integer> {
    Optional<RedefinicaoSenha> findFirstByUsuarioIdAndUsadoEmIsNullOrderByCriadoEmDesc(Integer usuarioId);
    List<RedefinicaoSenha> findByUsuarioIdAndUsadoEmIsNull(Integer usuarioId);
    List<RedefinicaoSenha> findByUsuarioId(Integer usuarioId);
}
