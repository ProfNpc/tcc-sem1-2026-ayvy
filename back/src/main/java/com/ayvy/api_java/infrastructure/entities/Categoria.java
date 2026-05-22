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

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}
