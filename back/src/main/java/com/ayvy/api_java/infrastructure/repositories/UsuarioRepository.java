package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Cliente;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

   // Optional<Usuario> findByNome (String nome);
}
