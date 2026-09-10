package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "historico_compras")
@Entity
public class HistoricoCompras {
@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;


    @ManyToOne(optional = false)
    @MapsId
    @JoinColumn (name = "pedido_id")
    private Pedido pedido;


    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = false)
    private Usuario usuario;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusPedido status = StatusPedido.entregue;

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
}
