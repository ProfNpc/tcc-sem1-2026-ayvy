package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tabela visualizacoes_produtos: cada visualização de produto (ranking e "Escolhas para você").
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "visualizacoes_produtos")
@Entity

public class VisualizacoesProduto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** null = visitante sem login. */
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "visualizado_em", nullable = false, updatable = false)
    private LocalDateTime visualizadoEm;

}
