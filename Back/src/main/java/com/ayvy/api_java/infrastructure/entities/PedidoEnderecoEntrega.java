package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pedido_endereco_entrega")
@Entity
public class PedidoEnderecoEntrega {

    @Id
    private Long id;

    @ManyToOne(optional = false)
    @MapsId
    @JoinColumn (name = "pedido_id")
    private Pedido pedido;

    @Column(name = "logradouro", nullable = false)
    private String logradouro;

    @Column(name = "numero", nullable = false)
    private String numero;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro", nullable = false)
    private String bairro;

    @Column(name = "cidade", nullable = false)
    private String cidade;

    @Column(name = "uf", nullable = false, columnDefinition = "CHAR(2)")
    private String uf;

    @Column(name = "cep", nullable = false, columnDefinition = "CHAR(8)")
    private String cep;
}
