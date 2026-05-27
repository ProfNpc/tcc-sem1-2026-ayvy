package br.belval.com.ayvy.repository;

import br.belval.com.ayvy.model.Categoria;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    Optional<Categoria> findByNomeCategoria(String nomeCategoria);

}