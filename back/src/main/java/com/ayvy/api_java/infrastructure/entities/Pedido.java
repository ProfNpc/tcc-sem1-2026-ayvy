package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusPedido;
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
@Table(name = "pedidos")
@Entity
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = false)
    private Usuario usuario;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusPedido status = StatusPedido.aguardando_pagamento;

    @Column(name = "valor_subtotal", nullable = false)
    private BigDecimal valorSubtotal = BigDecimal.ZERO;

    @Column(name = "valor_frete", nullable = false)
    private BigDecimal valorFrete = BigDecimal.ZERO;

    @Column(name = "valor_total", nullable = false)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    //Conferir se utilizaremos o dado de atualização
    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
