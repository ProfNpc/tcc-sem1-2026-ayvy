package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Consultas da tabela enderecos (endereço principal do usuário = origem do frete do lojista).
 */
public interface EnderecoRepository extends JpaRepository<Endereco, Integer> {
    Optional<Endereco> findByUsuarioIdAndPrincipalTrue(Integer usuarioId);


}
