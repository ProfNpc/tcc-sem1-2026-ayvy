package com.ayvy.api_java.infrastructure.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "produto_imagens")
@Entity
public class ProdutoImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    /** Caminho relativo salvo no disco, ex.: /uploads/produtos/uuid.jpg */
    @Column(name = "url", nullable = false, length = 500)
    private String caminho;

    @Column(name = "ordem", nullable = false)
    private Integer ordem = 0;
}
