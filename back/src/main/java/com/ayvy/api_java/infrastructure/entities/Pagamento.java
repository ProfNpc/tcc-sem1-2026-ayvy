package com.ayvy.api_java.infrastructure.entities;
//!!!!!!!!!!!!!!!VERIFICAR OS RELACIONAMENTOS NO BD - CONCEITUAL!!!!!!!!!
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
@Table(name = "pagamento")
@Entity


public class Pagamento {

    @Id
    @GeneratedValue (strategy = GenerationType.AUTO)
    private Integer id;

    @Column (name = "status")
    private String status;

    @Column (name = "valor")
    private BigDecimal valor;

    @CreationTimestamp
    @Column (name = "data", nullable = false)
    private LocalDateTime dataPagamento;

    @Column (name = "tipo")
    private String tipo;

}
