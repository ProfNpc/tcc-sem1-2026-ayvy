package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.ProdutoVariacaoRequest;
import com.ayvy.api_java.dto.ProdutoVariacaoResponse;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.ProdutoVariacao;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoVariacaoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProdutoVariacaoService {
    private final ProdutoVariacaoRepository produtoVariacaoRepository;
    private final ProdutoRepository produtoRepository;

    public ProdutoVariacaoService(ProdutoVariacaoRepository produtoVariacaoRepository, ProdutoRepository produtoRepository) {
        this.produtoVariacaoRepository = produtoVariacaoRepository;
        this.produtoRepository = produtoRepository;
    }

    //Listar todas as variações de um produto
    public List<ProdutoVariacaoResponse> listarVariacoes(Integer produtoId){
        if(!produtoRepository.existsById(produtoId)){
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Produto não encontrado");
        }
        return produtoVariacaoRepository.findByProdutoId(produtoId)
                .stream()
                .map(ProdutoVariacaoResponse::fromEntity)
                .toList();
    }

    //Listar variações ativas
    public List<ProdutoVariacaoResponse> listarVariacoesAtivas(Integer produtoId){
        if(!produtoRepository.existsById(produtoId)){
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Produto não encontrado");
        }
        return produtoVariacaoRepository.findByProdutoIdAndAtivoTrue(produtoId)
                .stream()
                .map(ProdutoVariacaoResponse::fromEntity)
                .toList();
    }

    //Criar variação
    @Transactional
    public ProdutoVariacaoResponse criarVariacao(Integer produtoId,
                                                 ProdutoVariacaoRequest request){
        Produto produto = buscarProduto(produtoId);

        validarDados(request);

        if(produtoVariacaoRepository.existsByProdutoIdAndTamanhoAndCor(
                produtoId, request.getTamanho(), request.getCor())){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Essa combinação de tamanho e cor já existe para esse produto");
        }

        ProdutoVariacao variacao = ProdutoVariacao.builder()
                .produto(produto)
                .tamanho(request.getTamanho().trim())
                .cor(request.getCor().trim())
                .estoque(request.getEstoque())
                .ativo(true)
                .build();

        return ProdutoVariacaoResponse.fromEntity(
                produtoVariacaoRepository.saveAndFlush(variacao));
    }

    //Update de variação
    @Transactional
    public ProdutoVariacaoResponse atualizarVariacao(
            Integer produtoId,
            Integer variacaoId,
            ProdutoVariacaoRequest request
    ) {
        ProdutoVariacao variacao = buscarVariacao(produtoId, variacaoId);

        validarDados(request);

        if(produtoVariacaoRepository.existsByProdutoIdAndTamanhoAndCorAndIdNot(
                produtoId,
                request.getTamanho().trim(),
                request.getCor().trim(),
                variacaoId)) {

          throw new ResponseStatusException(
                   HttpStatus.CONFLICT, "Essa combinação de tamnaho e cor já existe");
        }

        variacao.setTamanho(request.getTamanho().trim());
        variacao.setCor(request.getCor().trim());
        variacao.setEstoque(request.getEstoque());

        return ProdutoVariacaoResponse.fromEntity(
                produtoVariacaoRepository.saveAndFlush(variacao));
    }

    //Desativar uma variação
    @Transactional
    public void desativarVariacao(Integer produtoId, Integer variacaoId) {
        ProdutoVariacao variacao = buscarVariacao(produtoId, variacaoId);

        variacao.setAtivo(false);

        produtoVariacaoRepository.save(variacao);
    }

    //Ativar novamente
    @Transactional
    public void ativarVariacao(Integer produtoId, Integer variacaoId) {
        ProdutoVariacao variacao = buscarVariacao(produtoId, variacaoId);

        variacao.setAtivo(true);

        produtoVariacaoRepository.save(variacao);
    }

    private Produto buscarProduto(Integer produtoId){
        return produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }

    private ProdutoVariacao  buscarVariacao(Integer produtoId, Integer variacaoId){
        return produtoVariacaoRepository.findByIdAndProdutoId(variacaoId, produtoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Variação não encontrada para este produto"));
    }

    private void validarDados(ProdutoVariacaoRequest request){

        if(request.getTamanho() == null || request.getTamanho().isBlank()){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "O tamanho é obrigatório");
        }

        if(request.getCor() == null || request.getCor().isBlank()){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "A cor é obrigatória");
        }

        if (request.getEstoque() == null || request.getEstoque() < 0){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "O estoque deve ser maior ou igual a zero");
        }
    }
}
