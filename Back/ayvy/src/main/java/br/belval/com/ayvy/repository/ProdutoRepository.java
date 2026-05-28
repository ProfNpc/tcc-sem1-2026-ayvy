package br.belval.com.ayvy.repository;

import br.belval.com.ayvy.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    // Métodos prontos de banco de dados
}
