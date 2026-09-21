package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoProdutosRepository extends JpaRepository<PedidoProdutos, Integer > {
    List<PedidoProdutos> findByPedidoId(Integer pedidoId);
}
