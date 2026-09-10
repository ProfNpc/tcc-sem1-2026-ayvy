package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoProdutosRepository extends JpaRepository<PedidoProdutos, Integer > {
}
