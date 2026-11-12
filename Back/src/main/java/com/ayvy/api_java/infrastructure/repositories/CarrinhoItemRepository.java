package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.CarrinhoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Consultas da tabela carrinho_itens (carrinho da conta).
 */
public interface CarrinhoItemRepository extends JpaRepository<CarrinhoItem, Integer> {
    List<CarrinhoItem> findByUsuarioIdOrderByIdAsc(Integer usuarioId);
    List<CarrinhoItem> findByProdutoId(Integer produtoId);
    List<CarrinhoItem> findByProdutoVariacaoId(Integer produtoVariacaoId);
}
