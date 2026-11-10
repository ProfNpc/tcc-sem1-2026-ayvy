package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tabela produtos: nome, preço, desconto (%), estoque, cores, tamanhos, status, categoria principal e
 * categoriasExtras (tabela produto_categorias_extras). getPrecoFinal() = preço com desconto (vai no JSON).
 * Atenção: descontoPercentual e categoriasExtras não têm valor padrão de propósito — num PUT parcial
 * (ex.: publicar envia só o status) eles chegam nulos e não são apagados.
 */
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

    /** Categorias a mais em que o produto também aparece (ex.: tênis em Calçados e em Streetwear). */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "produto_categorias_extras",
            joinColumns = @JoinColumn(name = "produto_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_id"))
    private Set<Categoria> categoriasExtras;

//    @OneToOne
//    @JoinColumn(name = "favoritos_id", nullable = false, unique = true)
//    private Favoritos favoritos;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "descricao", columnDefinition = "NVARCHAR(MAX)")
    private String descricao;

    @Column(name = "preco", nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    /** Desconto em % (0 a 90). Vale na vitrine e no valor cobrado no checkout. */
    @Column(name = "desconto_percentual")
    private Integer descontoPercentual;

    @Builder.Default
    @Column(name = "estoque", nullable = false)
    private Integer estoque = 0;

    /** Caminho relativo em back/uploads, ex.: /uploads/produtos/uuid.jpg */
    @JsonAlias("caminho")
    @Column(name = "imagem_principal_url")
    private String imagemPrincipalUrl;

    @Builder.Default
    @Column(name = "visualizacoes_total", nullable = false)
    private Integer visualizacoesTotal = 0;

    @Builder.Default
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

    //Garante que seja possível várias variações e que uma variação pertença
    //apenas a um produto.
    //@JsonIgnore evita o loop Produto -> variacoes -> produto -> variacoes... ao gerar o JSON
    //(as variações são lidas por GET /produtos/{id}/variacoes).
    @JsonIgnore
    @OneToMany(mappedBy = "produto")
    @Builder.Default
    private List<ProdutoVariacao> variacoes = new ArrayList<>();

    /** Cores das variações ativas (vai no JSON como "cores", que o front já lê). */
    @Transient
    @JsonProperty(value = "cores", access = JsonProperty.Access.READ_ONLY)
    public List<String> getCores() {
        if (variacoes == null) return List.of();
        return variacoes.stream().filter(ProdutoVariacao::isAtivo)
                .map(ProdutoVariacao::getCor).distinct().collect(Collectors.toList());
    }

    /** Tamanhos das variações ativas (vai no JSON como "tamanhos", que o front já lê). */
    @Transient
    @JsonProperty(value = "tamanhos", access = JsonProperty.Access.READ_ONLY)
    public List<String> getTamanhos() {
        if (variacoes == null) return List.of();
        return variacoes.stream().filter(ProdutoVariacao::isAtivo)
                .map(ProdutoVariacao::getTamanho).distinct().collect(Collectors.toList());
    }

    /** Preço com o desconto aplicado (vai no JSON como "precoFinal"); é o valor cobrado no checkout. */
    @Transient
    public BigDecimal getPrecoFinal() {
        if (preco == null) return null;
        int desconto = descontoPercentual == null ? 0 : Math.max(0, Math.min(90, descontoPercentual));
        if (desconto == 0) return preco;
        return preco.multiply(BigDecimal.valueOf(100 - desconto))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

}