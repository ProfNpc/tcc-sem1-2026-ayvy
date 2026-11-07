package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.HistoricoCompras;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Consultas da linha do tempo do pedido (historico_compras), em ordem de data.
 */
public interface HistoricoComprasRepository extends JpaRepository<HistoricoCompras, Integer> {
    List<HistoricoCompras> findByPedidoIdOrderByCriadoEmAsc(Integer pedidoId);
}
