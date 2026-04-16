package br.belval.com.ayvy.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "categoria")
@Entity

public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //permitir apenas números? a organização, como em telefone o padrão '11 9xxxx-xxxx', é com o front?
    @Column(name = "nome_categoria")
    private String nome_categoria;

}
