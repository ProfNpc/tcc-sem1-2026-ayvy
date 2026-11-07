package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.EstoqueItemRequest;
import com.ayvy.api_java.infrastructure.entities.EstoqueItem;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.Notificacoes;
import com.ayvy.api_java.infrastructure.entities.Pedido;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import com.ayvy.api_java.infrastructure.repositories.EstoqueItemRepository;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import com.ayvy.api_java.infrastructure.repositories.NotificacoesRepository;
import com.ayvy.api_java.infrastructure.repositories.PedidoProdutosRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * "Meu estoque" do lojista (tela /meu-estoque, só lojistas).
 * - Planilha: linhas produto + tamanho + quantidade (tabela estoque_itens). Com linhas, o estoque
 *   do produto passa a ser a soma delas.
 * - Ligação com vendas: o checkout chama baixarParaVenda (tira do tamanho comprado) e o cancelamento
 *   ou reembolso chama devolver (a peça volta). Quando uma linha zera, o lojista recebe notificação.
 * - Relatório: vendas e devoluções por mês, a partir dos itens de pedido da loja.
 */
@Service
public class EstoqueService {

    private static final Set<StatusPedido> VENDIDO =
            EnumSet.of(StatusPedido.pago, StatusPedido.em_separacao, StatusPedido.enviado, StatusPedido.entregue);
    private static final Set<StatusPedido> DEVOLVIDO = EnumSet.of(StatusPedido.cancelado, StatusPedido.reembolsado);

    private final EstoqueItemRepository estoqueRepository;
    private final ProdutoRepository produtoRepository;
    private final LojistaRepository lojistaRepository;
    private final PedidoProdutosRepository pedidoProdutosRepository;
    private final NotificacoesRepository notificacoesRepository;

    public EstoqueService(EstoqueItemRepository estoqueRepository,
                          ProdutoRepository produtoRepository,
                          LojistaRepository lojistaRepository,
                          PedidoProdutosRepository pedidoProdutosRepository,
                          NotificacoesRepository notificacoesRepository) {
        this.estoqueRepository = estoqueRepository;
        this.produtoRepository = produtoRepository;
        this.lojistaRepository = lojistaRepository;
        this.pedidoProdutosRepository = pedidoProdutosRepository;
        this.notificacoesRepository = notificacoesRepository;
    }

    // ------------------------------------------------------------------ planilha

    public List<EstoqueItem> listar(Integer lojistaId) {
        return estoqueRepository.findByLojistaIdOrderByIdAsc(lojistaId);
    }

    /** Cria a planilha com uma linha por produto da loja (quantidade = estoque atual do produto). */
    @Transactional
    public List<EstoqueItem> criarPlanilha(Integer lojistaId) {
        Lojista lojista = buscarLojista(lojistaId);
        for (Produto produto : produtoRepository.findByLojistaId(lojistaId)) {
            if (estoqueRepository.existsByProdutoId(produto.getId())) continue;
            estoqueRepository.save(EstoqueItem.builder()
                    .lojista(lojista)
                    .produto(produto)
                    .tamanho(null)
                    .quantidade(Math.max(0, produto.getEstoque() == null ? 0 : produto.getEstoque()))
                    .build());
        }
        return listar(lojistaId);
    }

    /** Adiciona peças: se já existe a linha do mesmo produto e tamanho, soma a quantidade. */
    @Transactional
    public EstoqueItem adicionar(EstoqueItemRequest req) {
        Lojista lojista = buscarLojista(req.getLojistaId());
        Produto produto = buscarProdutoDaLoja(req.getProdutoId(), lojista.getId());
        int quantidade = validarQuantidade(req.getQuantidade());
        String tamanho = normalizarTamanho(req.getTamanho());

        List<EstoqueItem> linhas = estoqueRepository.findByProdutoId(produto.getId());
        EstoqueItem linha = acharLinha(linhas, tamanho, false);
        if (linha == null) {
            linha = EstoqueItem.builder().lojista(lojista).produto(produto).tamanho(tamanho).quantidade(quantidade).build();
        } else {
            linha.setQuantidade(linha.getQuantidade() + quantidade);
        }
        linha = estoqueRepository.save(linha);
        sincronizarProduto(produto);
        return linha;
    }

    @Transactional
    public EstoqueItem atualizar(Integer id, EstoqueItemRequest req) {
        EstoqueItem linha = buscarLinha(id);
        if (req.getQuantidade() != null) {
            linha.setQuantidade(validarQuantidade(req.getQuantidade()));
        }
        if (req.getTamanho() != null) {
            String tamanho = normalizarTamanho(req.getTamanho());
            EstoqueItem outra = acharLinha(estoqueRepository.findByProdutoId(linha.getProduto().getId()), tamanho, false);
            if (outra != null && !outra.getId().equals(linha.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Já existe uma linha de " + linha.getProduto().getNome() + " nesse tamanho");
            }
            linha.setTamanho(tamanho);
        }
        linha = estoqueRepository.save(linha);
        sincronizarProduto(linha.getProduto());
        return linha;
    }

    /** Remove a linha da planilha; o estoque do produto vira a soma das linhas que sobraram. */
    @Transactional
    public void remover(Integer id) {
        EstoqueItem linha = buscarLinha(id);
        Produto produto = linha.getProduto();
        estoqueRepository.delete(linha);
        List<EstoqueItem> restantes = estoqueRepository.findByProdutoId(produto.getId());
        produto.setEstoque(restantes.stream().mapToInt(EstoqueItem::getQuantidade).sum());
        produtoRepository.save(produto);
    }

    // ------------------------------------------------------------------ ligação com pedidos

    /** Checkout: confere e tira do estoque o tamanho comprado (ou o estoque geral do produto). */
    public void baixarParaVenda(Produto produto, String tamanhoComprado, int quantidade) {
        List<EstoqueItem> linhas = estoqueRepository.findByProdutoId(produto.getId());
        if (linhas.isEmpty()) {
            int atual = produto.getEstoque() == null ? 0 : produto.getEstoque();
            if (atual < quantidade) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente para " + produto.getNome());
            }
            produto.setEstoque(atual - quantidade);
            produtoRepository.save(produto);
            if (produto.getEstoque() == 0) avisarRepor(produto, null);
            return;
        }
        String tamanho = normalizarTamanho(tamanhoComprado);
        EstoqueItem linha = acharLinha(linhas, tamanho, true);
        String rotulo = produto.getNome() + (tamanho != null ? " (tamanho " + tamanho + ")" : "");
        if (linha == null || linha.getQuantidade() < quantidade) {
            int resta = linha == null ? 0 : linha.getQuantidade();
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Estoque insuficiente para " + rotulo + ": restam " + resta);
        }
        linha.setQuantidade(linha.getQuantidade() - quantidade);
        estoqueRepository.save(linha);
        sincronizarProduto(produto);
        if (linha.getQuantidade() == 0) avisarRepor(produto, linha.getTamanho());
    }

    /** Cancelamento/reembolso: a peça volta para o estoque (no mesmo tamanho, quando existir). */
    public void devolver(Produto produto, String tamanhoComprado, int quantidade) {
        List<EstoqueItem> linhas = estoqueRepository.findByProdutoId(produto.getId());
        if (linhas.isEmpty()) {
            produto.setEstoque((produto.getEstoque() == null ? 0 : produto.getEstoque()) + quantidade);
            produtoRepository.save(produto);
            return;
        }
        EstoqueItem linha = acharLinha(linhas, normalizarTamanho(tamanhoComprado), true);
        if (linha == null) {
            linha = EstoqueItem.builder()
                    .lojista(produto.getLojista())
                    .produto(produto)
                    .tamanho(normalizarTamanho(tamanhoComprado))
                    .quantidade(0)
                    .build();
        }
        linha.setQuantidade(linha.getQuantidade() + quantidade);
        estoqueRepository.save(linha);
        sincronizarProduto(produto);
    }

    /** Lojista mudou o "Estoque" no formulário do produto: só aplica se houver 0 ou 1 linha na planilha. */
    public boolean aplicarEstoqueDoFormulario(Produto produto, int novoEstoque) {
        List<EstoqueItem> linhas = estoqueRepository.findByProdutoId(produto.getId());
        if (linhas.isEmpty()) return false;
        if (linhas.size() == 1) {
            EstoqueItem unica = linhas.get(0);
            unica.setQuantidade(Math.max(0, novoEstoque));
            estoqueRepository.save(unica);
        }
        produto.setEstoque(estoqueRepository.findByProdutoId(produto.getId()).stream()
                .mapToInt(EstoqueItem::getQuantidade).sum());
        return true;
    }

    public void apagarLinhasDoProduto(Integer produtoId) {
        estoqueRepository.deleteAll(estoqueRepository.findByProdutoId(produtoId));
    }

    // ------------------------------------------------------------------ relatório de vendas

    public record Mes(String mes, int vendidos, double valorVendido, int devolvidos, double valorDevolvido) {}

    public record Movimento(String tipo, String produto, String tamanho, int quantidade, double valor,
                            LocalDateTime data, String codigo) {}

    public record ItemVendido(Integer produtoId, String tamanho, int vendidos) {}

    public record Relatorio(List<Mes> meses, List<Movimento> movimentos, List<ItemVendido> porItem,
                            int totalVendidos, double valorVendido, int totalDevolvidos, double valorDevolvido) {}

    public Relatorio relatorio(Integer lojistaId) {
        buscarLojista(lojistaId);
        Map<YearMonth, double[]> porMes = new TreeMap<>();
        Map<String, ItemVendido> porItem = new LinkedHashMap<>();
        List<Movimento> movimentos = new ArrayList<>();
        int totalVendidos = 0;
        int totalDevolvidos = 0;
        double valorVendido = 0;
        double valorDevolvido = 0;

        for (PedidoProdutos item : pedidoProdutosRepository.findByLojistaId(lojistaId)) {
            Pedido pedido = item.getPedido();
            if (pedido == null || pedido.getStatus() == null) continue;
            boolean vendido = VENDIDO.contains(pedido.getStatus());
            boolean devolvido = DEVOLVIDO.contains(pedido.getStatus());
            if (!vendido && !devolvido) continue;

            int qtd = item.getQuantidade() == null ? 0 : item.getQuantidade();
            double valor = qtd * (item.getPrecoUnitario() == null ? 0 : item.getPrecoUnitario());
            LocalDateTime data = devolvido && pedido.getAtualizadoEm() != null ? pedido.getAtualizadoEm() : pedido.getCriadoEm();
            if (data == null) continue;
            double[] mes = porMes.computeIfAbsent(YearMonth.from(data), m -> new double[4]);

            if (vendido) {
                mes[0] += qtd;
                mes[1] += valor;
                totalVendidos += qtd;
                valorVendido += valor;
                String chave = item.getProduto().getId() + "|" + (item.getTamanho() == null ? "" : item.getTamanho());
                ItemVendido atual = porItem.get(chave);
                porItem.put(chave, new ItemVendido(item.getProduto().getId(), item.getTamanho(),
                        (atual == null ? 0 : atual.vendidos()) + qtd));
            } else {
                mes[2] += qtd;
                mes[3] += valor;
                totalDevolvidos += qtd;
                valorDevolvido += valor;
            }
            String tipo = vendido ? "venda" : pedido.getStatus() == StatusPedido.reembolsado ? "reembolso" : "cancelamento";
            movimentos.add(new Movimento(tipo, item.getProduto().getNome(), item.getTamanho(), qtd, valor, data,
                    item.getCodigoPedidoLoja()));
        }

        List<Mes> meses = new ArrayList<>();
        porMes.forEach((ym, v) -> meses.add(new Mes(ym.toString(), (int) v[0], arredondar(v[1]), (int) v[2], arredondar(v[3]))));
        movimentos.sort(Comparator.comparing(Movimento::data).reversed());
        return new Relatorio(meses, movimentos.stream().limit(30).toList(), new ArrayList<>(porItem.values()),
                totalVendidos, arredondar(valorVendido), totalDevolvidos, arredondar(valorDevolvido));
    }

    // ------------------------------------------------------------------ auxiliares

    private void sincronizarProduto(Produto produto) {
        List<EstoqueItem> linhas = estoqueRepository.findByProdutoId(produto.getId());
        if (linhas.isEmpty()) return;
        produto.setEstoque(linhas.stream().mapToInt(EstoqueItem::getQuantidade).sum());
        produtoRepository.save(produto);
    }

    /** Linha do tamanho; com `usarGeral`, cai na linha "todos os tamanhos" quando não há o tamanho exato. */
    private static EstoqueItem acharLinha(List<EstoqueItem> linhas, String tamanho, boolean usarGeral) {
        EstoqueItem geral = null;
        for (EstoqueItem l : linhas) {
            if (l.getTamanho() == null) {
                if (tamanho == null) return l;
                geral = l;
            } else if (tamanho != null && l.getTamanho().equalsIgnoreCase(tamanho)) {
                return l;
            }
        }
        return usarGeral ? geral : null;
    }

    private void avisarRepor(Produto produto, String tamanho) {
        Lojista lojista = produto.getLojista();
        if (lojista == null || lojista.getUsuario() == null) return;
        String nome = produto.getNome() + (tamanho != null ? " (tamanho " + tamanho + ")" : "");
        notificacoesRepository.save(Notificacoes.builder()
                .usuario(lojista.getUsuario())
                .titulo("Repor estoque: " + (nome.length() > 120 ? nome.substring(0, 119) + "…" : nome))
                .mensagem("Acabou o estoque de " + nome + ". Reponha ou remova da planilha em Meu estoque.")
                .tipo("estoque")
                .lida(false)
                .build());
    }

    private Lojista buscarLojista(Integer lojistaId) {
        if (lojistaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o lojistaId");
        }
        return lojistaRepository.findById(lojistaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loja não encontrada"));
    }

    private Produto buscarProdutoDaLoja(Integer produtoId, Integer lojistaId) {
        if (produtoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha um produto da sua loja");
        }
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
        if (produto.getLojista() == null || !produto.getLojista().getId().equals(lojistaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este produto não é da sua loja");
        }
        return produto;
    }

    private EstoqueItem buscarLinha(Integer id) {
        return estoqueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Linha do estoque não encontrada"));
    }

    private static int validarQuantidade(Integer quantidade) {
        if (quantidade == null || quantidade < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma quantidade de 0 ou mais");
        }
        if (quantidade > 100_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade muito alta");
        }
        return quantidade;
    }

    private static String normalizarTamanho(String tamanho) {
        if (tamanho == null) return null;
        String limpo = tamanho.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    private static double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
