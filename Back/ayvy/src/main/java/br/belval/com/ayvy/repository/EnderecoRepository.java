package br.belval.com.ayvy.repository;

import br.belval.com.ayvy.model.Endereco;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

   // Optional<Endereco> findByCep(String cep);

    @Transactional
    void deleteEnderecoById(Long id);
}
