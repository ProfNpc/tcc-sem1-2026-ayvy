package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Tabela notificacoes: avisos de um usuário. tipo: pedido (cliente), pedido_loja (lojista),
 * pedido_admin (admin), estoque (repor estoque). Criadas pelo PedidoService e pelo EstoqueService.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "notificacoes")
@Entity
public class Notificacoes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "mensagem", nullable = false)
    private String mensagem;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "lida_em", updatable = false)
    private LocalDateTime lidaEm;

    @Column(name = "lida")
    private Boolean lida;

}
