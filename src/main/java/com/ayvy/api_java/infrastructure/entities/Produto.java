package com.ayvy.api_java.infrastructure.entities;


import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

//Pegar e settar informações de algum atributo com Lombok:
@Getter
@Setter
//Para acessar a classe:
@AllArgsConstructor
@NoArgsConstructor
//Para futuros Updates:
@Builder
//Indicar que é tabela:
@Table(name = "produtos")
@Entity

public class Produto {

    //Cria um valor automáticamente:
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @ManyToOne
    @JoinColumn(name="lojista_id", nullable = false)
    private Lojista lojista;

    @ManyToOne
    @JoinColumn(name="categoria_id")
    private Categoria categoria;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "preco")
    private BigDecimal preco;

    @Column(name="descricao")
    private String descricao;

    @Column(name = "estoque", nullable = false)
    private Integer estoque;

    @Column(name = "imagem_principal_url")
    private String imagemPrincipalUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusProduto statusProduto =  StatusProduto.RASCUNHO;

    //Criar de visualizacoes
    @Column(name="visualizacoes_total")
    private Integer visualizacoesTotal = 0;

    //Data de criação e atualização da data toda vez que a entity sofre um UPDATE
    @CreationTimestamp
    @Column(name="criado_Em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
