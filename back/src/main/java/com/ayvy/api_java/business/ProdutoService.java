package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.ProdutoImagemRequest;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.ProdutoImagem;
import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import com.ayvy.api_java.infrastructure.repositories.ProdutoImagemRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.util.List;

@Service
public class ProdutoService {

    private final ProdutoRepository repository;
    private final ProdutoImagemRepository produtoImagemRepository;
    private final UploadService uploadService;

    public ProdutoService(
            ProdutoRepository repository,
            ProdutoImagemRepository produtoImagemRepository,
            UploadService uploadService
    ) {
        this.repository = repository;
        this.produtoImagemRepository = produtoImagemRepository;
        this.uploadService = uploadService;
    }

    public Produto salvarProduto(Produto produto) {
        if (produto.getLojista() == null || produto.getLojista().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'lojista' (id) é obrigatório");
        }
        validarCaminhoImagem(produto.getImagemPrincipalUrl());
        aplicarDefaults(produto);
        return repository.saveAndFlush(produto);
    }

    private void aplicarDefaults(Produto produto) {
        if (produto.getEstoque() == null) {
            produto.setEstoque(0);
        }
        if (produto.getVisualizacoesTotal() == null) {
            produto.setVisualizacoesTotal(0);
        }
        if (produto.getStatusProduto() == null) {
            produto.setStatusProduto(StatusProduto.rascunho);
        }
    }

    public Produto buscarProdutoPorId(Integer id) {

        Produto produto = repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado")
        );
        repository.incrementarVisualizacao(id);

        return produto;
    }

    public List<Produto> listarProdutos() {
        return repository.findAll();
    }

    public void deletarProdutoPorId(Integer id) {
        repository.deleteById(id);
    }

    public Produto atualizarProdutoPorId(Integer id, Produto produto) {
        Produto produtoEntity = buscarProdutoPorId(id);

        if (produto.getNome() != null) {
            produtoEntity.setNome(produto.getNome());
        }
        if (produto.getPreco() != null) {
            produtoEntity.setPreco(produto.getPreco());
        }
        if (produto.getDescricao() != null) {
            produtoEntity.setDescricao(produto.getDescricao());
        }
        if (produto.getImagemPrincipalUrl() != null) {
            validarCaminhoImagem(produto.getImagemPrincipalUrl());
            produtoEntity.setImagemPrincipalUrl(produto.getImagemPrincipalUrl());
        }
        if (produto.getEstoque() != null) {
            produtoEntity.setEstoque(produto.getEstoque());
        }
        if (produto.getSlug() != null) {
            produtoEntity.setSlug(produto.getSlug());
        }
        if (produto.getStatusProduto() != null) {
            produtoEntity.setStatusProduto(produto.getStatusProduto());
        }
        if (produto.getCategoria() != null) {
            produtoEntity.setCategoria(produto.getCategoria());
        }

        return repository.saveAndFlush(produtoEntity);
    }

    public ProdutoImagem adicionarImagem(Integer produtoId, ProdutoImagemRequest request) {
        if (request.getCaminho() == null || request.getCaminho().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'caminho' é obrigatório");
        }
        validarCaminhoImagem(request.getCaminho());

        Produto produto = repository.findById(produtoId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado")
        );

        ProdutoImagem imagem = ProdutoImagem.builder()
                .produto(produto)
                .caminho(request.getCaminho())
                .ordem(
                        request.getOrdem() != null
                                ? request.getOrdem().shortValue()
                                : (short) 0
                )
                .build();

        return produtoImagemRepository.saveAndFlush(imagem);
    }

    public List<ProdutoImagem> listarImagensProduto(Integer produtoId) {
        if (!repository.existsById(produtoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        }
        return produtoImagemRepository.findByProduto_IdOrderByOrdemAsc(produtoId);
    }

    public void removerImagem(Integer produtoId, Integer imagemId) {
        if (!repository.existsById(produtoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        }
        ProdutoImagem imagem = produtoImagemRepository.findById(imagemId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada")
        );
        if (!imagem.getProduto().getId().equals(produtoId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem não pertence a este produto");
        }
        produtoImagemRepository.delete(imagem);
    }

    private void validarCaminhoImagem(String caminho) {
        if (caminho == null || caminho.isBlank()) {
            return;
        }
        var fisico = uploadService.resolverCaminhoFisico(caminho);
        if (!Files.exists(fisico)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Arquivo de imagem não encontrado em uploads: " + caminho
            );
        }
    }
}
