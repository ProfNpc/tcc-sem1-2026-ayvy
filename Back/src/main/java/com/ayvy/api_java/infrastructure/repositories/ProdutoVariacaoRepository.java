package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.ProdutoVariacao;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProdutoVariacaoRepository extends JpaRepository<ProdutoVariacao, Integer> {
    List<ProdutoVariacao> findByProdutoId(Integer produtoId);

    List<ProdutoVariacao> findByProdutoIdAndAtivoTrue(Integer produtoId);

    Optional<ProdutoVariacao> findByIdAndProdutoId(Integer id, Integer produtoId);

    //Impede que dois pedidos sejam feitos e 'consumam' o último e mesmo item do estoque
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pv From ProdutoVariacao pv WHERE pv.id = :id")
    Optional<ProdutoVariacao> buscarPorIdComBloqueio(@Param("id") Integer id);

    //evitando duplicação de combinações de variação
    //para criação
    boolean existsByProdutoIdAndTamanhoAndCor(Integer produtoId,
                                              String tamanho,
                                              String cor);

    //para atualização
    boolean existsByProdutoIdAndTamanhoAndCorAndIdNot(
            Integer produtoId,
            String tamanho,
            String cor,
            Integer id
    );

}