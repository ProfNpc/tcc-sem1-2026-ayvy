package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import com.ayvy.api_java.infrastructure.repositories.ClienteRepository;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final ClienteRepository clienteRepository;
    private final LojistaRepository lojistaRepository;
    private final UploadService uploadService;

    public UsuarioService(
            UsuarioRepository repository,
            ClienteRepository clienteRepository,
            LojistaRepository lojistaRepository,
            UploadService uploadService
    ) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.lojistaRepository = lojistaRepository;
        this.uploadService = uploadService;
    }

    /**
     * Cadastro de identidade (login). Perfil de negócio é criado depois em /clientes ou /lojistas.
     * Todo usuário novo entra como {@link StatusUsuario#ativo} se status não for enviado.
     */
    public Usuario salvarUsuario(Usuario usuario) {
        aplicarDefaultsCadastro(usuario);
        validarCadastroUsuario(usuario);
        validarAvatar(usuario.getAvatarUrl());
        return repository.saveAndFlush(usuario);
    }

    public Usuario buscarUsuarioPorId(Integer id) {
        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")
        );
    }

    public List<Usuario> listarUsuarios() {
        return repository.findAll();
    }

    public void deletarUsuario(Integer id) {
        Usuario usuario = buscarUsuarioPorId(id);
        repository.delete(usuario);
    }

    public Usuario atualizarUsuarioPorId(Integer id, Usuario usuario) {
        Usuario usuarioEntity = buscarUsuarioPorId(id);

        if (usuario.getNome() != null) {
            usuarioEntity.setNome(usuario.getNome());
        }
        if (usuario.getEmail() != null) {
            usuarioEntity.setEmail(usuario.getEmail());
        }
        if (usuario.getTelefone() != null) {
            usuarioEntity.setTelefone(usuario.getTelefone());
        }
        if (usuario.getSenha() != null) {
            usuarioEntity.setSenha(usuario.getSenha());
        }
        if (usuario.getAvatarUrl() != null) {
            validarAvatar(usuario.getAvatarUrl());
            usuarioEntity.setAvatarUrl(usuario.getAvatarUrl());
        }
        if (usuario.getStatus() != null) {
            usuarioEntity.setStatus(usuario.getStatus());
        }
        // papel não é alterável após criação (evita inconsistência com perfis)

        return repository.saveAndFlush(usuarioEntity);
    }

    public void validarUsuarioParaPerfil(Integer usuarioId, PapelUsuario papelEsperado) {
        Usuario usuario = buscarUsuarioPorId(usuarioId);

        if (usuario.getPapel() != papelEsperado) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário deve ter papel '" + papelEsperado + "'. Papel atual: " + usuario.getPapel()
            );
        }

        if (usuario.getStatus() != StatusUsuario.ativo) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário deve estar com status 'ativo' para vincular perfil"
            );
        }

        if (papelEsperado == PapelUsuario.cliente && clienteRepository.findByUsuario_Id(usuarioId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuário já possui perfil de cliente");
        }

        if (papelEsperado == PapelUsuario.lojista && lojistaRepository.findByUsuario_Id(usuarioId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuário já possui perfil de lojista");
        }

        if (papelEsperado == PapelUsuario.admin) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Administrador não possui perfil separado; use apenas POST /usuarios com papel admin"
            );
        }
    }

    private void aplicarDefaultsCadastro(Usuario usuario) {
        if (usuario.getStatus() == null) {
            usuario.setStatus(StatusUsuario.ativo);
        }
    }

    private void validarAvatar(String caminho) {
        if (caminho == null || caminho.isBlank()) {
            return;
        }
        var fisico = uploadService.resolverCaminhoFisico(caminho);
        if (!java.nio.file.Files.exists(fisico)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Arquivo de avatar não encontrado: " + caminho
            );
        }
    }

    private void validarCadastroUsuario(Usuario usuario) {
        if (usuario.getPapel() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Campo 'papel' é obrigatório: admin, cliente ou lojista"
            );
        }
        if (usuario.getNome() == null || usuario.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'nome' é obrigatório");
        }
        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'email' é obrigatório");
        }
        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'senha' é obrigatório");
        }
    }
}
