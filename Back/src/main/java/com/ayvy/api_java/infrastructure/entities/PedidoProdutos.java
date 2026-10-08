package com.ayvy.api_java.infrastructure.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="pedido_produtos")
@Entity

public class PedidoProdutos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @ManyToOne
    @JoinColumn(name = "lojista_id", nullable = false)
    private Lojista lojista;

    @Column(name = "quantidade")
    private Integer quantidade;

    @Column(name = "preco_unitario")
    private Double precoUnitario;

    @Column(name = "cor", length = 60)
    private String cor;

    @Column(name = "tamanho", length = 30)
    private String tamanho;

    /** Sequência do pedido dentro da loja: o 1º pedido da loja é 1, o 2º é 2... */
    @Column(name = "numero_pedido_loja")
    private Integer numeroPedidoLoja;

    /** Código exibido e pesquisável do pedido na loja: sigla da loja + sequência (ex.: "LU-1"). */
    @Column(name = "codigo_pedido_loja", length = 20)
    private String codigoPedidoLoja;


}
