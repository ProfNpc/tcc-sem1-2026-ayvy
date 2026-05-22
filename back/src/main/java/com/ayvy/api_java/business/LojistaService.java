package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.LojistaCreateRequest;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LojistaService {

    private final LojistaRepository repository;
    private final UsuarioService usuarioService;
    private final UploadService uploadService;

    public LojistaService(
            LojistaRepository repository,
            UsuarioService usuarioService,
            UploadService uploadService
    ) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.uploadService = uploadService;
    }

    public void aprovarLojista(Integer id) {
        Lojista lojista = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado"));

        lojista.setStatus(StatusLoja.aprovado);
        lojista.setAprovadoEm(LocalDateTime.now());
        repository.save(lojista);
    }

    /**
     * Cria perfil de loja para um usuário já cadastrado com papel {@code lojista}.
     * Fluxo: POST /usuarios (papel lojista) → POST /lojistas (usuarioId + dados da loja).
     */
    public Lojista salvarLojista(LojistaCreateRequest request) {
        validarRequest(request);
        usuarioService.validarUsuarioParaPerfil(request.getUsuarioId(), PapelUsuario.lojista);

        Usuario usuario = usuarioService.buscarUsuarioPorId(request.getUsuarioId());

        validarCaminhoOpcional(request.getBannerUrl());
        validarCaminhoOpcional(request.getLogoUrl());

        Lojista lojista = Lojista.builder()
                .usuario(usuario)
                .nomeLoja(request.getNomeLoja())
                .slug(request.getSlug())
                .cnpj(request.getCnpj())
                .bannerUrl(request.getBannerUrl())
                .logoUrl(request.getLogoUrl())
                .descricao(request.getDescricao())
                .status(StatusLoja.aprovado)
                .aprovadoEm(LocalDateTime.now())
                .build();

        return repository.saveAndFlush(lojista);
    }

    public Lojista buscarLojistaPorId(Integer id) {
        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado")
        );
    }

    public List<Lojista> listarLojistas() {
        return repository.findAll();
    }

    public void deletarLojistaPorId(Integer id) {
        repository.deleteById(id);
    }

    public Lojista atualizarLojistaPorId(Integer id, Lojista lojista) {
        Lojista lojistaEntity = buscarLojistaPorId(id);

        if (lojista.getNomeLoja() != null) {
            lojistaEntity.setNomeLoja(lojista.getNomeLoja());
        }
        if (lojista.getCnpj() != null) {
            lojistaEntity.setCnpj(lojista.getCnpj());
        }
        if (lojista.getSlug() != null) {
            lojistaEntity.setSlug(lojista.getSlug());
        }
        if (lojista.getBannerUrl() != null) {
            lojistaEntity.setBannerUrl(lojista.getBannerUrl());
        }
        if (lojista.getLogoUrl() != null) {
            lojistaEntity.setLogoUrl(lojista.getLogoUrl());
        }
        if (lojista.getDescricao() != null) {
            lojistaEntity.setDescricao(lojista.getDescricao());
        }
        if (lojista.getStatus() != null) {
            lojistaEntity.setStatus(lojista.getStatus());
            if (lojista.getStatus() == StatusLoja.aprovado) {
                if (lojistaEntity.getAprovadoEm() == null) {
                    lojistaEntity.setAprovadoEm(LocalDateTime.now());
                }
            } else {
                lojistaEntity.setAprovadoEm(null);
            }
        }

        return repository.saveAndFlush(lojistaEntity);
    }

    private void validarCaminhoOpcional(String caminho) {
        if (caminho != null && !caminho.isBlank()) {
            var fisico = uploadService.resolverCaminhoFisico(caminho);
            if (!java.nio.file.Files.exists(fisico)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Arquivo de imagem não encontrado: " + caminho
                );
            }
        }
    }

    private void validarRequest(LojistaCreateRequest request) {
        if (request.getUsuarioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'usuarioId' é obrigatório");
        }
        if (request.getNomeLoja() == null || request.getNomeLoja().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'nomeLoja' é obrigatório");
        }
        if (request.getSlug() == null || request.getSlug().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'slug' é obrigatório");
        }
        if (request.getCnpj() == null || request.getCnpj().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'cnpj' é obrigatório");
        }
    }
}
