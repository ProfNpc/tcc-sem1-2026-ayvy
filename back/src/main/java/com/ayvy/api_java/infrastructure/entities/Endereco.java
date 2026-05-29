package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "enderecos")
@Entity
public class Endereco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "apelido")
    private String apelido;

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

    @Column(name = "principal", nullable = false)
    private Boolean principal = false;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
