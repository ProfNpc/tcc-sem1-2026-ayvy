package com.ayvy.api_java.infrastructure.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Linha da planilha "Meu estoque" do lojista: quantidade de um produto da loja em um tamanho
 * (tamanho nulo = todos os tamanhos juntos). Quando o produto tem linhas aqui, o estoque do
 * produto (produtos.estoque) passa a ser a soma das linhas.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "estoque_itens",
        uniqueConstraints = @UniqueConstraint(columnNames = {"produto_id", "tamanho"}))
@Entity
public class EstoqueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "lojista_id", nullable = false)
    private Lojista lojista;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "tamanho", length = 30)
    private String tamanho;

    @Column(name = "quantidade", nullable = false)
    private Integer quantidade;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
