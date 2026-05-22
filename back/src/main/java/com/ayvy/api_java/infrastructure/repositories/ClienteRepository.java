package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Cliente;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    Optional<Cliente> findByUsuario_Id(Integer usuarioId);

   //'Transactional' = se der qualquer erro essa função não é executada
   // já que é uma operação sensível
//   @Transactional
 //  void deleteByEmail(String email);

}
