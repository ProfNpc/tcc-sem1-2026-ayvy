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
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(name = "evento", nullable = false, length = 80)
    private String evento; // ex: "PEDIDO_CRIADO", "PAGAMENTO_CONFIRMADO"

    @Column(name = "status_pedido", length = 50)
    private String statusPedido; // snapshot do status no momento do evento

    @Column(name = "descricao", length = 500)
    private String descricao;

    @ManyToOne
    @JoinColumn(name = "actor_usuario_id")
    private Usuario actorUsuario; // pode ser ação automática do sistema

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
