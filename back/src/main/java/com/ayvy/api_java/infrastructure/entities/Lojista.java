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
@Table(name = "lojistas")
@Entity
public class Lojista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "nome_loja", nullable = false)
    private String nomeLoja;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "cnpj", nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_loja", nullable = false)
    private StatusLoja status = StatusLoja.pendente;

    @Column(name = "aprovado_em")
    private LocalDateTime aprovadoEm;
}
