package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Pedido;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import com.ayvy.api_java.infrastructure.repositories.PedidoProdutosRepository;
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
 * Relatório de vendas e devoluções do lojista (tela "Meu estoque"), por mês, a partir dos itens de
 * pedido da loja. O CONTROLE de estoque (quantidade por tamanho e cor) fica em ProdutoVariacaoService
 * e a baixa/devolução nas vendas fica no PedidoService.
 */
@Service
public class EstoqueService {

    private static final Set<StatusPedido> VENDIDO =
            EnumSet.of(StatusPedido.pago, StatusPedido.em_separacao, StatusPedido.enviado, StatusPedido.entregue);
    private static final Set<StatusPedido> DEVOLVIDO = EnumSet.of(StatusPedido.cancelado, StatusPedido.reembolsado);

    private final LojistaRepository lojistaRepository;
    private final PedidoProdutosRepository pedidoProdutosRepository;

    public EstoqueService(LojistaRepository lojistaRepository,
                          PedidoProdutosRepository pedidoProdutosRepository) {
        this.lojistaRepository = lojistaRepository;
        this.pedidoProdutosRepository = pedidoProdutosRepository;
    }

    // ------------------------------------------------------------------ relatório de vendas

    public record Mes(String mes, int vendidos, double valorVendido, int devolvidos, double valorDevolvido) {}

    public record Movimento(String tipo, String produto, String tamanho, int quantidade, double valor,
                            LocalDateTime data, String codigo, String cor) {}

    public record ItemVendido(Integer produtoId, String tamanho, int vendidos, String cor, Integer produtoVariacaoId) {}

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
                Integer variacaoId = item.getProdutoVariacaoId();
                String chave = variacaoId != null ? "v" + variacaoId
                        : item.getProduto().getId() + "|" + (item.getTamanho() == null ? "" : item.getTamanho())
                        + "|" + (item.getCor() == null ? "" : item.getCor());
                ItemVendido atual = porItem.get(chave);
                porItem.put(chave, new ItemVendido(item.getProduto().getId(), item.getTamanho(),
                        (atual == null ? 0 : atual.vendidos()) + qtd, item.getCor(), variacaoId));
            } else {
                mes[2] += qtd;
                mes[3] += valor;
                totalDevolvidos += qtd;
                valorDevolvido += valor;
            }
            String tipo = vendido ? "venda" : pedido.getStatus() == StatusPedido.reembolsado ? "reembolso" : "cancelamento";
            movimentos.add(new Movimento(tipo, item.getProduto().getNome(), item.getTamanho(), qtd, valor, data,
                    item.getCodigoPedidoLoja(), item.getCor()));
        }

        List<Mes> meses = new ArrayList<>();
        porMes.forEach((ym, v) -> meses.add(new Mes(ym.toString(), (int) v[0], arredondar(v[1]), (int) v[2], arredondar(v[3]))));
        movimentos.sort(Comparator.comparing(Movimento::data).reversed());
        return new Relatorio(meses, movimentos.stream().limit(30).toList(), new ArrayList<>(porItem.values()),
                totalVendidos, arredondar(valorVendido), totalDevolvidos, arredondar(valorDevolvido));
    }

    // ------------------------------------------------------------------ auxiliares

    private void buscarLojista(Integer lojistaId) {
        if (lojistaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o lojistaId");
        }
        lojistaRepository.findById(lojistaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loja não encontrada"));
    }

    private static double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}