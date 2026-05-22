package com.ayvy.api_java.infrastructure.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

//Importando Enums:
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "usuarios")
@Entity

public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "senha_hash")
    private String senha;

    @Column(name = "telefone", unique = true)
    private String telefone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    //Enum
    @Enumerated(EnumType.STRING)
    @Column(name="papel")
    private PapelUsuario papel;

    @Enumerated(EnumType.STRING)
    @Column(name="status")
    private StatusUsuario status =  StatusUsuario.ATIVO;

    @CreationTimestamp
    @Column(name="criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;

    //Último login ainda não existe, já que diferente dos outros dois de cima
    // ele é alterado manualmente == ++trabalho

}
