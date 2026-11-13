package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Produto;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Consultas da tabela produtos (por loja, slug, categoria principal e categorias extras).
 */
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    List<Produto> findByLojistaId(Integer id);

    Optional<Produto> findBySlug(String slug);

    boolean existsByCategoriaId(Integer categoriaId);

    List<Produto> findByCategoriaId(Integer categoriaId);

    List<Produto> findByCategoriasExtrasId(Integer categoriaId);

    /** Soma 1 direto no banco: duas visitas ao mesmo tempo não se perdem (ler + salvar perderia uma). */
    @Modifying
    @Query("UPDATE Produto p SET p.visualizacoesTotal = COALESCE(p.visualizacoesTotal, 0) + 1 WHERE p.id = :id")
    int somarVisualizacao(@Param("id") Integer id);

}
