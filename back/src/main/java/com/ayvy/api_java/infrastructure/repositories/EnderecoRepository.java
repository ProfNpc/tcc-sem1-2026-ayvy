package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Endereco;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

   // Optional<Endereco> findByCep(String cep);

    @Transactional
    void deleteEnderecoById(Long id);
}
