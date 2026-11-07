package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.PedidoEnderecoEntrega;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Consultas da tabela pedido_endereco_entrega (o id é o mesmo do pedido).
 */
public interface PedidoEnderecoEntregaRepository extends JpaRepository<PedidoEnderecoEntrega, Integer> {
}
