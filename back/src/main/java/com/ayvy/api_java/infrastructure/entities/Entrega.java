package com.ayvy.api_java.infrastructure.entities;
//!!!!!!!!!!!!!!!VERIFICAR OS RELACIONAMENTOS NO BD - CONCEITUAL!!!!!!!!!



//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ESSA TABELA NÃO SERÁ NECESSÁRIA!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "entrega")
@Entity

public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "status")
    private String status;

    @Column(name = "dataEnvio")
    private LocalDateTime dataEnvio;


}
