package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "produto_variacoes")
@Entity

public class ProdutoVariacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column (name = "tamanho", nullable = false, length = 30)
    private String tamanho;

    @Column (name = "cor", nullable = false, length = 60)
    private String cor;

    @Column (name = "estoque", nullable = false)
    private int estoque;

    @Column (name = "ativo", nullable = false)
    private boolean ativo;

}
