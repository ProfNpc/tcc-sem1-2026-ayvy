package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.FavoritosRequest;
import com.ayvy.api_java.infrastructure.entities.Favoritos;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.repositories.FavoritosRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FavoritosService {
    private final FavoritosRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;

    public FavoritosService(FavoritosRepository repository, UsuarioRepository usuarioRepository, ProdutoRepository produtoRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
    }

    public Favoritos favoritar (FavoritosRequest request) {
        if (repository.findByUsuarioIdAndProdutoId(request.getUsuarioId(), request.getProdutoId()).isPresent()){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto já favoritado por esse usuário");
        }

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        Produto produto = produtoRepository.findById(request.getProdutoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        Favoritos favoritos = Favoritos.builder()
                .usuario(usuario)
                .produto(produto)
                .build();

        return  repository.saveAndFlush(favoritos);
    }

    // Se o produto não estava favoritado, não há o que desfazer: o resultado é o mesmo (não favorito),
    // então não devolvemos erro. O controller responde 204 do mesmo jeito.
    public void desfavoritar (Integer usuarioId, Integer produtoId) {
        repository.findByUsuarioIdAndProdutoId(usuarioId, produtoId)
                .ifPresent(repository::delete);
    }

    public List<Favoritos> listarPorUsuario (Integer usuarioId) {
        return repository.findByUsuarioId(usuarioId);
    }

    //É favorito
    public Boolean favorito (Integer usuarioId, Integer produtoId) {
        return repository.findByUsuarioIdAndProdutoId(usuarioId,produtoId).isPresent();
    }


}
