package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "endereco")
@Entity

public class Endereco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //permitir apenas números? a organização, como em telefone o padrão '11 9xxxx-xxxx' -> (CEP: XXXXX-XXX) , é com o front?
    @Column(name = "cep", nullable = false)
    private String cep;

    @Column(name = "numero", nullable = false)
    private String numero;

    //Adicionar complemento?
}
