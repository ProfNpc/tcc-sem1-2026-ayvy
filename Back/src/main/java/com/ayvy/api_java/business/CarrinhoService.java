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

    /** Substitui o carrinho da conta pelo que veio do site ou do app (linhas iguais são somadas). */
    @Transactional
    public List<CarrinhoItem> substituir(Integer usuarioId, List<CarrinhoItemRequest> itens) {
        Usuario usuario = buscarUsuario(usuarioId);
        Map<String, CarrinhoItem> linhas = new LinkedHashMap<>();
        for (CarrinhoItemRequest req : itens == null ? List.<CarrinhoItemRequest>of() : itens) {
            if (req == null || req.getProdutoId() == null || req.getQuantidade() == null || req.getQuantidade() <= 0) {
                continue;
            }
            Produto produto = produtoRepository.findById(req.getProdutoId()).orElse(null);
            if (produto == null || produto.getStatusProduto() != StatusProduto.ativo) continue;
            String cor = textoOuNull(req.getCor());
            String tamanho = textoOuNull(req.getTamanho());
            String chave = produto.getId() + "|" + (cor == null ? "" : cor) + "|" + (tamanho == null ? "" : tamanho);
            CarrinhoItem linha = linhas.computeIfAbsent(chave, k -> CarrinhoItem.builder()
                    .usuario(usuario).produto(produto).cor(cor).tamanho(tamanho).quantidade(0).build());
            int estoque = estoqueDisponivel(produto, cor, tamanho);
            linha.setQuantidade(Math.min(linha.getQuantidade() + req.getQuantidade(), Math.max(estoque, 0)));
            if (linhas.size() > MAX_LINHAS) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrinho com itens demais");
            }
        }
        repository.deleteAll(repository.findByUsuarioIdOrderByIdAsc(usuarioId));
        repository.flush();
        List<CarrinhoItem> validas = linhas.values().stream().filter(l -> l.getQuantidade() > 0).toList();
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

    /**
     * Estoque das variações ativas que combinam com a cor e o tamanho pedidos.
     * Com cor e tamanho informados é a quantidade de uma variação só; sem eles, a soma das variações do produto.
     */
    private int estoqueDisponivel(Produto produto, String cor, String tamanho) {
        int total = 0;
        for (ProdutoVariacao v : produtoVariacaoRepository.findByProdutoIdAndAtivoTrue(produto.getId())) {
            boolean mesmaCor = cor == null || cor.equalsIgnoreCase(v.getCor());
            boolean mesmoTamanho = tamanho == null || tamanho.equalsIgnoreCase(v.getTamanho());
            if (mesmaCor && mesmoTamanho) total += v.getEstoque();
        }
        return total;
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
}