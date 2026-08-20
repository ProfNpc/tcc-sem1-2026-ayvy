package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "visualizacoesProduto")
@Entity

public class VisualizacoesProduto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @OneToOne
    @JoinColumn(name = "produto_id", nullable = false, unique = true)
    private Produto produto;

    @Column(name = "visualizado_em", nullable = false, updatable = false)
    private LocalDateTime visualizadoEm;

}
