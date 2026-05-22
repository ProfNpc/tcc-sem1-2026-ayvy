package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    public Usuario salvarUsuario(Usuario usuario) {
       return repository.saveAndFlush(usuario);
    }

    public Usuario buscarUsuarioPorId(Integer id) {

        return repository.findById(id).orElseThrow(
                () -> new RuntimeException("Usuário não encontrado.")
        );
    }

    public List<Usuario> listarUsuarios() {
        return repository.findAll();
    }

    public void deletarUsuario(Integer id) {
        Usuario usuario = buscarUsuarioPorId(id);
        repository.deleteById(id);
    }

    public Usuario atualizarUsuarioPorId(Integer id, Usuario usuario) {
        Usuario usuarioEntity = buscarUsuarioPorId(id);

        if(usuario.getNome()!=null) {
            usuarioEntity.setNome(usuario.getNome());
        }
        if(usuario.getEmail()!=null) {
            usuarioEntity.setEmail(usuario.getEmail());
        }
        if(usuario.getTelefone()!=null) {
            usuarioEntity.setTelefone(usuario.getTelefone());
        }
        if (usuario.getSenha()!=null) {
            usuarioEntity.setSenha(usuario.getSenha());
        }
        if(usuario.getAvatarUrl()!=null) {
            usuarioEntity.setAvatarUrl(usuario.getAvatarUrl());
        }
        if(usuario.getPapel()!=null) {
            usuarioEntity.setPapel(usuario.getPapel());
        }
        if(usuario.getStatus()!=null) {
            usuarioEntity.setStatus(usuario.getStatus());
        }
        return repository.saveAndFlush(usuarioEntity);
    }

}
