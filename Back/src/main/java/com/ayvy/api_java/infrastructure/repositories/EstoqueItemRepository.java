package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.EstoqueItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Consultas da planilha de estoque (estoque_itens) por loja e por produto.
 */
public interface EstoqueItemRepository extends JpaRepository<EstoqueItem, Integer> {
    List<EstoqueItem> findByLojistaIdOrderByIdAsc(Integer lojistaId);
    List<EstoqueItem> findByProdutoId(Integer produtoId);
    boolean existsByProdutoId(Integer produtoId);
}
