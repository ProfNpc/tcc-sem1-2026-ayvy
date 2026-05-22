package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

//Pegar e settar informações de algum atributo com Lombok:
@Getter
@Setter
//Para acessar a classe:
@AllArgsConstructor
@NoArgsConstructor
//Para futuros Updates:
@Builder
//Indicar que é tabela:
@Table(name = "clientes")
@Entity

public class Cliente {

    //Cria um valor automáticamente:
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "data_nascimento")
    private Date dataNascimento;

    @Column(name = "cpf", unique = true)
    private String cpf;


}
