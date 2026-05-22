package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Produto;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    List<Produto> findByLojistaId(Integer id);

    @Modifying
    @Transactional
    @Query("""
            UPDATE Produto p
            SET p.visualizacoesTotal = p.visualizacoesTotal + 1
            WHERE p.id = :id 
           """)

    void incrementarVisualizacao(@Param("id") Integer id);

//OU extend CrudRepository do Jpa
    //Deletar pelo Id ou pelo Nome? Por enquanto por Id.
   // @Transactional
  //  void deleteById(Integer id);
}
