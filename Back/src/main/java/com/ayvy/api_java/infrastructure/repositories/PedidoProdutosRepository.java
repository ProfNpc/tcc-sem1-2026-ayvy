package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Consultas dos itens de pedido: por pedido, por loja (relatório do estoque), pelo código LU-1 e o
 * maior número de pedido da loja (para gerar o próximo código).
 */
public interface PedidoProdutosRepository extends JpaRepository<PedidoProdutos, Integer > {
    List<PedidoProdutos> findByPedidoId(Integer pedidoId);

    List<PedidoProdutos> findByLojistaId(Integer lojistaId);

    List<PedidoProdutos> findByNumeroPedidoLojaIsNullOrderByPedidoIdAsc();

    List<PedidoProdutos> findByCodigoPedidoLojaIsNullAndNumeroPedidoLojaIsNotNull();

    List<PedidoProdutos> findByCodigoPedidoLoja(String codigoPedidoLoja);

    @Query("select coalesce(max(pp.numeroPedidoLoja), 0) from PedidoProdutos pp where pp.lojista.id = :lojistaId")
    Integer maiorNumeroPedidoDaLoja(@Param("lojistaId") Integer lojistaId);
}
