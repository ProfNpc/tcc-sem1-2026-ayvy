package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.VisualizacoesRequest;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.entities.VisualizacoesProduto;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import com.ayvy.api_java.infrastructure.repositories.VisualizacoesProdutoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class VisualizacoesProdutoService {
    private final VisualizacoesProdutoRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;

    public VisualizacoesProdutoService(VisualizacoesProdutoRepository repository, UsuarioRepository usuarioRepository, ProdutoRepository produtoRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public void registrarVisualizacao(VisualizacoesRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        Produto produto = produtoRepository.findById(request.getProdutoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        VisualizacoesProduto visuaualizacao = VisualizacoesProduto.builder()
                .usuario(usuario)
                .produto(produto)
                .visualizadoEm(LocalDateTime.now())
                .build();

        repository.saveAndFlush(visuaualizacao);

        produto.setVisualizacoesTotal(produto.getVisualizacoesTotal() + 1);
        produtoRepository.save(produto);
    }

        public long contarPorProduto(Integer produtoId){
            return repository.countBuProdutoId(produtoId);
        }

}
