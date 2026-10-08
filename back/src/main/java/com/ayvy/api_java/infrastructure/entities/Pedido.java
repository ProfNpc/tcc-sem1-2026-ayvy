package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
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

    @Column(name = "valor_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorSubtotal = BigDecimal.ZERO;

    @Column(name = "valor_frete", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorFrete = BigDecimal.ZERO;

    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @Column(name = "transportadora", length = 60)
    private String transportadora;

    @Column(name = "codigo_rastreio", length = 80)
    private String codigoRastreio;

    @Column(name = "previsao_entrega")
    private LocalDate previsaoEntrega;

    @Column(name = "observacao_envio", length = 500)
    private String observacaoEnvio;

    @Column(name = "local_postagem", length = 300)
    private String localPostagem;

    @Column(name = "recebido_em")
    private LocalDateTime recebidoEm;

    @Column(name = "enviado_em")
    private LocalDateTime enviadoEm;

    @Column(name = "entregue_em")
    private LocalDateTime entregueEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    //Conferir se utilizaremos o dado de atualização
    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    /*
     * Sem integração com transportadora, o rastreio é simulado após o despacho:
     * o pacote leva SEGUNDOS_TRAJETO para ir de uma etapa à próxima e fica
     * SEGUNDOS_PARADA parado em cada etapa intermediária.
     * Despachado -> Coletado (2 min) | parado (3 min) | -> Em rota (2 min) | parado (3 min) | -> Entregue (2 min).
     * O front usa os mesmos tempos para animar o caminhão.
     */
    public static final long SEGUNDOS_TRAJETO = 120;
    public static final long SEGUNDOS_PARADA = 180;

    /** Segundos desde o despacho (só enquanto o pedido está com status "enviado"). */
    @Transient
    public Long getSegundosDesdeEnvio() {
        if (status != StatusPedido.enviado) return null;
        LocalDateTime base = enviadoEm != null ? enviadoEm : atualizadoEm;
        if (base == null) return null;
        return Math.max(0, Duration.between(base, LocalDateTime.now()).getSeconds());
    }

    /**
     * Etapa do rastreio: aguardando, recebido, preparando, despachado, coletado, em_rota, entregue ou cancelado.
     * Com status "enviado", a etapa "entregue" indica que o lojista já pode confirmar a entrega.
     */
    @Transient
    public String getEtapaEnvio() {
        if (status == null) return "aguardando";
        switch (status) {
            case cancelado:
            case reembolsado:
                return "cancelado";
            case entregue:
                return "entregue";
            case em_separacao:
                return "preparando";
            case enviado: {
                Long segundos = getSegundosDesdeEnvio();
                if (segundos == null) return "despachado";
                if (segundos >= 3 * SEGUNDOS_TRAJETO + 2 * SEGUNDOS_PARADA) return "entregue";
                if (segundos >= 2 * SEGUNDOS_TRAJETO + SEGUNDOS_PARADA) return "em_rota";
                if (segundos >= SEGUNDOS_TRAJETO) return "coletado";
                return "despachado";
            }
            case pago:
                return recebidoEm != null ? "recebido" : "aguardando";
            default:
                return "aguardando";
        }
    }
}
