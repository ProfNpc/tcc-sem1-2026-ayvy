package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "produtos")
@Entity
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lojista_id", nullable = false)
    private Lojista lojista;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "preco", nullable = false)
    private BigDecimal preco;

    @Column(name = "estoque", nullable = false)
    private Integer estoque = 0;

    /** Caminho relativo em back/uploads, ex.: /uploads/produtos/uuid.jpg */
    @JsonAlias("caminho")
    @Column(name = "imagem_principal_url")
    private String imagemPrincipalUrl;

    @Column(name = "visualizacoes_total", nullable = false)
    private Integer visualizacoesTotal = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @JsonProperty("status")
    private StatusProduto statusProduto = StatusProduto.rascunho;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
