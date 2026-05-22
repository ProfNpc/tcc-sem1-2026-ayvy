package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class ProdutoService {

    //Injetando o Repository manualmente aqui no service
    private final ProdutoRepository repository;


    public ProdutoService(ProdutoRepository repository) {
        this.repository = repository;
    }

    //CRIANDO O CRUD:
    //Create
    //Read
    //Update
    //Delete



    //"CREATE"
    public Produto salvarProduto(Produto produto){
        return repository.saveAndFlush(produto);
        //return ("Produto salvo!");
    }

    //"READ"
    public Produto buscarProdutoPorId(Integer id){

        repository.incrementarVisualizacao(id);

        return repository.findById(id).orElseThrow(
                () -> new RuntimeException("Produto não encontrado")
        );
    }

    //"READ"
    public List<Produto> listarProdutos(){
        return repository.findAll();
    }

    //"DELETE"
    public void deletarProdutoPorId(Integer id){
        repository.deleteById(id);
       // return ("Produto deletado.");
    }

    //"UPDATDE"
    public Produto atualizarProdutoPorId(Integer id, Produto produto){
        Produto produtoEntity =  buscarProdutoPorId(id);

        if(produto.getNome() != null){
            produtoEntity.setNome(produto.getNome());
        }
        if(produto.getPreco() != null){
        produtoEntity.setPreco(produto.getPreco());
        }
        if(produto.getDescricao() != null){
            produtoEntity.setDescricao(produto.getDescricao());
        }
        if(produto.getImagemPrincipalUrl() != null){
            produtoEntity.setImagemPrincipalUrl(produto.getImagemPrincipalUrl());
        }
        if(produto.getEstoque() != null){
            produtoEntity.setEstoque(produto.getEstoque());
        }
        if(produto.getSlug() != null){
            produtoEntity.setSlug(produto.getSlug());
        }
        if(produto.getStatusProduto() != null){
            produtoEntity.setStatusProduto(produto.getStatusProduto());
        }
        if(produto.getCategoria() != null){
            produtoEntity.setCategoria(produto.getCategoria());
        }


        return repository.saveAndFlush(produtoEntity);
       // return ("Produto atualizado com sucesso!");

    }


        /* ========= ! FORMA ANTIGA ! =============================================
        Produto produtoAtualizado = Produto.builder()
                .nome_produto(produto.getNome_produto() != null ?
                        produto.getNome_produto() : produtoEntity.getNome_produto())
                .preco(produto.getPreco() != null ?
                        produto.getPreco() : produtoEntity.getPreco())
                .id(produtoEntity.getId())
                .build();

                repository.saveAndFlush(produtoAtualizado);
    }*/



}
