package br.belval.com.ayvy.repository;

import br.belval.com.ayvy.model.Produto;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProdutoRepository extends JpaRepository<Produto, Integer> {
//OU extend CrudRepository do Jpa
    //Deletar pelo Id ou pelo Nome? Por enquanto por Id.
   // @Transactional
  //  void deleteById(Integer id);
}
