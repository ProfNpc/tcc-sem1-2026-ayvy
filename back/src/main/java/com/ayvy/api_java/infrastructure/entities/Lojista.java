package com.ayvy.api_java.infrastructure.entities;

import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="lojistas")
@Entity

public class Lojista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "nome_loja")
    private String nomeLoja;

    //Faz parte da url legível('/loja-ayvy') ao invés de '/id=1'
    @Column(name = "slug", unique = true)
    private String slug;

    @Column(name = "cnpj", unique = true)
    private String cnpj;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "aprovado_em")
    private LocalDateTime aprovadoEm;

    //Enum
    @Enumerated(EnumType.STRING)
    @Column(name = "status_loja")
    private StatusLoja status = StatusLoja.PENDENTE;

}
