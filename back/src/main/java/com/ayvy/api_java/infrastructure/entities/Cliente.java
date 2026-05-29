package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "clientes")
@Entity
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "cpf", nullable = false, unique = true, columnDefinition = "CHAR(11)")
    private String cpf;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;
}
