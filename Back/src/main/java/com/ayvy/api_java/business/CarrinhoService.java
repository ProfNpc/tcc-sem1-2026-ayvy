package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.CarrinhoItemRequest;
import com.ayvy.api_java.infrastructure.entities.CarrinhoItem;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.entities.ProdutoVariacao;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import com.ayvy.api_java.infrastructure.repositories.CarrinhoItemRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoVariacaoRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Carrinho salvo na conta do cliente, compartilhado entre o site e o app.
 * O site e o app enviam o carrinho inteiro (PUT /carrinho) a cada mudança e leem com GET /carrinho.
 * Produto ou variação inexistente gera erro; produto ou variação inativa é descartada.
 * A quantidade fica limitada ao estoque da variação escolhida, em produto_variacoes.
 */
@Service
public class CarrinhoService {

    private static final int MAX_LINHAS = 60;

    private final CarrinhoItemRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final ProdutoVariacaoRepository produtoVariacaoRepository;

    public CarrinhoService(CarrinhoItemRepository repository,
                           UsuarioRepository usuarioRepository,
                           ProdutoRepository produtoRepository,
                           ProdutoVariacaoRepository produtoVariacaoRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.produtoVariacaoRepository = produtoVariacaoRepository;
    }

    public List<CarrinhoItem> listar(Integer usuarioId) {
        buscarUsuario(usuarioId);
        return repository.findByUsuarioIdOrderByIdAsc(usuarioId);
    }

    /** Substitui o carrinho da conta pelo que veio do site ou do app (linhas iguais são somadas). */
    @Transactional
    public List<CarrinhoItem> substituir(Integer usuarioId, List<CarrinhoItemRequest> itens) {
        Usuario usuario = buscarUsuario(usuarioId);

        Map<Integer, CarrinhoItem> linhas = new LinkedHashMap<>();

        for (CarrinhoItemRequest req : itens == null ? List.<CarrinhoItemRequest>of() : itens) {
            if (req == null) continue;

            if (req.getProdutoId() == null
                    || req.getProdutoVariacaoId() == null
                    || req.getQuantidade() == null
                    || req.getQuantidade() <= 0) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Informe produto, variação e quantidade válida");
            }
            Produto produto = produtoRepository.findById(req.getProdutoId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Produto não encontrado"));

            if (produto.getStatusProduto() != StatusProduto.ativo) continue;

            ProdutoVariacao variacao = produtoVariacaoRepository
                    .findByIdAndProdutoId(req.getProdutoVariacaoId(), req.getProdutoId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Variação não encontrada para esse produto"));

            if (!variacao.isAtivo()) continue;

            int estoque = Math.max(variacao.getEstoque(), 0);

            CarrinhoItem linha = linhas.computeIfAbsent(
                    variacao.getId(),
                    id -> CarrinhoItem.builder()
                            .usuario(usuario)
                            .produto(produto)
                            .produtoVariacao(variacao)
                            .cor(variacao.getCor())
                            .tamanho(variacao.getTamanho())
                            .quantidade(0)
                            .build()
            );

            linha.setQuantidade(Math.min(linha.getQuantidade() + req.getQuantidade(), estoque));

            if (linhas.size() > MAX_LINHAS) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Carrinho com itens demais");}
        }

        repository.deleteAll(
                repository.findByUsuarioIdOrderByIdAsc(usuarioId));

        repository.flush();

        List<CarrinhoItem> validas = linhas.values()
                .stream()
                .filter(l -> l.getQuantidade() > 0)
                .toList();

        return repository.saveAll(validas);
    }

    @Transactional
    public void limpar(Integer usuarioId) {
        buscarUsuario(usuarioId);
        repository.deleteAll(repository.findByUsuarioIdOrderByIdAsc(usuarioId));
    }

    /** Usado ao excluir um produto: tira ele de todos os carrinhos. */
    public void removerProdutoDosCarrinhos(Integer produtoId) {
        repository.deleteAll(repository.findByProdutoId(produtoId));
    }

    private Usuario buscarUsuario(Integer usuarioId) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o usuarioId");
        }
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    @Transactional
    public void removerVariacaoDosCarrinhos(Integer VariacaoId) {
        repository.deleteAll(repository
                .findByProdutoVariacaoId(VariacaoId));
    }
}