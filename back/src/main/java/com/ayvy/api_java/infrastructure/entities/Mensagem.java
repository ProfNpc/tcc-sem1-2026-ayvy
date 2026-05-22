package com.ayvy.api_java.infrastructure.entities;
//!!!!!!!!!!!!!!!VERIFICAR OS RELACIONAMENTOS NO BD - CONCEITUAL!!!!!!!!!
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "mensagem")
@Entity

public class Mensagem {

    // ESSA TABELA É MESMO NECESSÁRIA? OU É POSSÍVEL IMPORTAR UMA API PRONTA?
    @Id
    @GeneratedValue (strategy = GenerationType.AUTO)
    private Integer id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "texto")
    private String texto;

    @CreationTimestamp
    @Column(name = "dataEnvio")
    private LocalDateTime dataEnvio;

    //Será necessário? como realizar essa confirmação?
    @CreationTimestamp
    @Column(name = "dataRecebimento")
    private LocalDateTime dataRecebimento;

    @UpdateTimestamp
    @Column(name = "dataEditado")
    private LocalDateTime dataEditado;

}
