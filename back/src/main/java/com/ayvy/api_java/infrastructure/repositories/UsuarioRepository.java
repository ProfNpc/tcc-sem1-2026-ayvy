package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Cliente;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Consultas da tabela usuarios (por status, papel e e-mail).
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    List<Usuario> findByStatus(StatusUsuario status);
    List<Usuario> findByPapel(PapelUsuario papel);
   Optional<Usuario> findByEmail (String email);
}
