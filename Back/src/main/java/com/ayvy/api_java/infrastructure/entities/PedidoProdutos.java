package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="pedidoProduto")
@Entity

public class PedidoProdutos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    private Pedido pedido;

    @OneToOne
    @JoinColumn(name = "produto_id", nullable = false, unique = true)
    private Produto produto;

    @OneToOne
    @JoinColumn(name = "lojista_id", nullable = false, unique = true)
    private Lojista lojista;

    @Column(name = "quantidade")
    private Integer quantidade;

    @Column(name = "preco_unitario")
    private Double precoUnitario;


}
