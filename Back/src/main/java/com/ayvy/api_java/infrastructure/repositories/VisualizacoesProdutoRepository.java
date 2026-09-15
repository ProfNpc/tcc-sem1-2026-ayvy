package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.VisualizacoesProduto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisualizacoesProdutoRepository extends JpaRepository<VisualizacoesProduto, Integer> {
    long countBuProdutoId(Integer produtoId);
}
