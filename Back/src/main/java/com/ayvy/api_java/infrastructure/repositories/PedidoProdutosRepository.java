package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PedidoProdutosRepository extends JpaRepository<PedidoProdutos, Integer > {
    List<PedidoProdutos> findByPedidoId(Integer pedidoId);

    List<PedidoProdutos> findByNumeroPedidoLojaIsNullOrderByPedidoIdAsc();

    List<PedidoProdutos> findByCodigoPedidoLojaIsNullAndNumeroPedidoLojaIsNotNull();

    List<PedidoProdutos> findByCodigoPedidoLoja(String codigoPedidoLoja);

    @Query("select coalesce(max(pp.numeroPedidoLoja), 0) from PedidoProdutos pp where pp.lojista.id = :lojistaId")
    Integer maiorNumeroPedidoDaLoja(@Param("lojistaId") Integer lojistaId);
}
