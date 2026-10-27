package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "categorias")
@Entity
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    /** Categoria principal (ex.: "Moda Feminina"); nulo quando esta já é uma categoria principal. */
    @ManyToOne
    @JoinColumn(name = "categoria_pai_id")
    private Categoria categoriaPai;

    /** Ícone Font Awesome usado no site, ex.: "fa-person-dress". */
    @Column(name = "icone", length = 40)
    private String icone;

    @Column(name = "ordem")
    private Integer ordem;
}
