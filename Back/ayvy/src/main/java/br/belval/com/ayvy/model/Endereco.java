package br.belval.com.ayvy.model;

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

    //permitir apenas números? a organização, como em telefone o padrão '11 9xxxx-xxxx', é com o front?
    @Column(name = "cep")
    private String cep;

    @Column(name = "numero")
    private String numero;

    //Adicionar complemento?
}
