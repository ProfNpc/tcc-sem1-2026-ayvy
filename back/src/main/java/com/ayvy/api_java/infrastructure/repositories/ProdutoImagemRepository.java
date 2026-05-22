package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.ProdutoImagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProdutoImagemRepository extends JpaRepository<ProdutoImagem, Integer> {

    List<ProdutoImagem> findByProduto_IdOrderByOrdemAsc(Integer produtoId);
}
