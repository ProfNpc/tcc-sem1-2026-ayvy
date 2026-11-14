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
 * Produtos inexistentes ou inativos são descartados e a quantidade é limitada ao estoque da variação
 * (cor + tamanho) escolhida, em produto_variacoes.
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

    /**
     * Substitui o carrinho da conta pelo que veio do site ou do app (linhas iguais são somadas).
     * O site não conhece o id da variação: ele manda produtoId + cor + tamanho, e a variação é
     * descoberta aqui. Produto sem variações cadastradas entra no carrinho sem variação, limitado
     * ao estoque do produto. Linha inválida (produto/variação inexistente) é ignorada em vez de
     * derrubar o carrinho inteiro com erro.
     */
    @Transactional
    public List<CarrinhoItem> substituir(Integer usuarioId, List<CarrinhoItemRequest> itens) {
        Usuario usuario = buscarUsuario(usuarioId);

        Map<String, CarrinhoItem> linhas = new LinkedHashMap<>();

        for (CarrinhoItemRequest req : itens == null ? List.<CarrinhoItemRequest>of() : itens) {
            if (req == null) continue;

            if (req.getProdutoId() == null
                    || req.getQuantidade() == null
                    || req.getQuantidade() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Informe produto e quantidade válida");
            }

            Produto produto = produtoRepository.findById(req.getProdutoId()).orElse(null);
            if (produto == null || produto.getStatusProduto() != StatusProduto.ativo) continue;

            ProdutoVariacao variacao = null;
            if (req.getProdutoVariacaoId() != null) {
                variacao = produtoVariacaoRepository
                        .findByIdAndProdutoId(req.getProdutoVariacaoId(), req.getProdutoId())
                        .orElse(null);
                if (variacao == null || !variacao.isAtivo()) continue;
            } else {
                List<ProdutoVariacao> ativas = produtoVariacaoRepository
                        .findByProdutoIdAndAtivoTrue(req.getProdutoId());
                if (!ativas.isEmpty()) {
                    variacao = escolherVariacao(ativas, req.getCor(), req.getTamanho());
                    if (variacao == null) continue;
                }
            }

            int estoque = variacao != null
                    ? Math.max(variacao.getEstoque(), 0)
                    : Math.max(produto.getEstoque() == null ? 0 : produto.getEstoque(), 0);

            String chave = variacao != null ? "v" + variacao.getId() : "p" + produto.getId();
            final ProdutoVariacao variacaoFinal = variacao;

            CarrinhoItem linha = linhas.computeIfAbsent(
                    chave,
                    k -> CarrinhoItem.builder()
                            .usuario(usuario)
                            .produto(produto)
                            .produtoVariacao(variacaoFinal)
                            .cor(variacaoFinal != null ? variacaoFinal.getCor() : textoOuNull(req.getCor()))
                            .tamanho(variacaoFinal != null ? variacaoFinal.getTamanho() : textoOuNull(req.getTamanho()))
                            .quantidade(0)
                            .build()
            );

            linha.setQuantidade(Math.min(
                    linha.getQuantidade() + req.getQuantidade(),
                    estoque));

            if (linhas.size() > MAX_LINHAS) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Carrinho com itens demais");
            }
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

    /** Acha a variação ativa pela cor e tamanho; cor/tamanho em branco valem como "qualquer". */
    private static ProdutoVariacao escolherVariacao(List<ProdutoVariacao> ativas, String cor, String tamanho) {
        String c = textoOuNull(cor);
        String t = textoOuNull(tamanho);
        List<ProdutoVariacao> candidatas = ativas.stream()
                .filter(v -> c == null || v.getCor().equalsIgnoreCase(c))
                .filter(v -> t == null || v.getTamanho().equalsIgnoreCase(t))
                .toList();
        if (candidatas.isEmpty()) return null;
        return candidatas.stream().filter(v -> v.getEstoque() > 0).findFirst().orElse(candidatas.get(0));
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

    private static String textoOuNull(String valor) {
        if (valor == null) return null;
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    @Transactional
    public void removerVariacaoDosCarrinhos(Integer VariacaoId) {
        repository.deleteAll(repository
                .findByProdutoVariacaoId(VariacaoId));
    }
}