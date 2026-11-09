package com.ayvy.api_java.config;

import com.ayvy.api_java.business.UploadService;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.ProdutoImagem;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoImagemRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * A pasta back/uploads não vai para o git (.gitignore), então quem só faz "git pull" fica com
 * produtos, avatares e logos apontando para arquivos que não existem (imagem quebrada no site).
 * Ao subir, este bootstrap confere todas as imagens usadas no banco e copia as que faltam a partir
 * das pastas do repositório (IMAGENS/ e mobile/login-app/assets/), pelo nome do arquivo.
 * Nunca sobrescreve arquivos que já existem.
 */
@Component
@Order(6)
public class ImagensSeedBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ImagensSeedBootstrap.class);

    private final ProdutoRepository produtoRepository;
    private final ProdutoImagemRepository produtoImagemRepository;
    private final UsuarioRepository usuarioRepository;
    private final LojistaRepository lojistaRepository;
    private final UploadService uploadService;
    private final List<Path> pastasOrigem;

    public ImagensSeedBootstrap(ProdutoRepository produtoRepository,
                                ProdutoImagemRepository produtoImagemRepository,
                                UsuarioRepository usuarioRepository,
                                LojistaRepository lojistaRepository,
                                UploadService uploadService,
                                @Value("${ayvy.seed.imagens-dirs:../IMAGENS,../mobile/login-app/assets}") String pastas) {
        this.produtoRepository = produtoRepository;
        this.produtoImagemRepository = produtoImagemRepository;
        this.usuarioRepository = usuarioRepository;
        this.lojistaRepository = lojistaRepository;
        this.uploadService = uploadService;
        this.pastasOrigem = Arrays.stream(pastas.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> Paths.get(s).toAbsolutePath().normalize())
                .toList();
    }

    @Override
    public void run(ApplicationArguments args) {
        Set<String> caminhos = new LinkedHashSet<>();
        for (Produto p : produtoRepository.findAll()) caminhos.add(p.getImagemPrincipalUrl());
        for (ProdutoImagem i : produtoImagemRepository.findAll()) caminhos.add(i.getCaminho());
        for (Usuario u : usuarioRepository.findAll()) caminhos.add(u.getAvatarUrl());
        for (Lojista l : lojistaRepository.findAll()) {
            caminhos.add(l.getLogoUrl());
            caminhos.add(l.getBannerUrl());
        }

        int copiadas = 0;
        List<String> semOrigem = new ArrayList<>();
        for (String caminho : caminhos) {
            if (caminho == null || !caminho.startsWith("/uploads/")) continue;
            Path destino;
            try {
                destino = uploadService.resolverCaminhoFisico(caminho);
            } catch (RuntimeException e) {
                continue;
            }
            if (Files.exists(destino)) continue;

            Path origem = acharNasPastas(destino.getFileName().toString());
            if (origem == null) {
                semOrigem.add(caminho);
                continue;
            }
            try {
                Files.createDirectories(destino.getParent());
                Files.copy(origem, destino);
                copiadas++;
            } catch (IOException e) {
                log.warn("ImagensSeedBootstrap: não consegui copiar {} para {}", origem, destino, e);
            }
        }

        if (copiadas > 0) {
            log.info("ImagensSeedBootstrap: {} imagem(ns) que faltavam em uploads foram copiadas do repositório", copiadas);
        }
        if (!semOrigem.isEmpty()) {
            log.warn("ImagensSeedBootstrap: {} imagem(ns) sem arquivo em uploads nem nas pastas do repositório: {}",
                    semOrigem.size(), semOrigem);
        }
    }

    private Path acharNasPastas(String nomeArquivo) {
        for (Path pasta : pastasOrigem) {
            Path candidato = pasta.resolve(nomeArquivo);
            if (Files.isRegularFile(candidato)) return candidato;
        }
        return null;
    }
}
