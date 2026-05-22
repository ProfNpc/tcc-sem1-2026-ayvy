package com.ayvy.api_java.infrastructure.entities;

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
@Table(name = "pagamentos")
@Entity
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(name = "valor", nullable = false)
    private BigDecimal valor;

    @Column(name = "status", nullable = false)
    private String status = "pendente";

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "referencia")
    private String referencia;

    @Column(name = "pago_em")
    private LocalDateTime pagoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
