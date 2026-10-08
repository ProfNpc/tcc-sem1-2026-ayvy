package com.ayvy.api_java.config;

import com.ayvy.api_java.business.SiglaLojaService;
import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import com.ayvy.api_java.infrastructure.repositories.PedidoProdutosRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Completa dados criados antes destas colunas existirem:
 * a sigla das lojas (lojistas.sigla) e o número/código de cada pedido na loja
 * (pedido_produtos.numero_pedido_loja e codigo_pedido_loja), na ordem em que os pedidos foram feitos.
 */
@Component
@Order(3)
public class PedidoNumeroLojaBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PedidoNumeroLojaBootstrap.class);

    private final PedidoProdutosRepository pedidoProdutosRepository;
    private final LojistaRepository lojistaRepository;
    private final SiglaLojaService siglaLojaService;

    public PedidoNumeroLojaBootstrap(PedidoProdutosRepository pedidoProdutosRepository,
                                     LojistaRepository lojistaRepository,
                                     SiglaLojaService siglaLojaService) {
        this.pedidoProdutosRepository = pedidoProdutosRepository;
        this.lojistaRepository = lojistaRepository;
        this.siglaLojaService = siglaLojaService;
    }

    @Override
    public void run(ApplicationArguments args) {
        preencherSiglas();
        preencherNumeros();
        preencherCodigos();
    }

    private void preencherSiglas() {
        int total = 0;
        for (Lojista lojista : lojistaRepository.findAll()) {
            if (siglaLojaService.garantirSigla(lojista)) {
                lojistaRepository.saveAndFlush(lojista);
                total++;
            }
        }
        if (total > 0) log.info("Sigla gerada para {} lojas", total);
    }

    private void preencherNumeros() {
        List<PedidoProdutos> pendentes = pedidoProdutosRepository.findByNumeroPedidoLojaIsNullOrderByPedidoIdAsc();
        if (pendentes.isEmpty()) return;

        Map<Integer, Integer> ultimoPorLoja = new HashMap<>();
        Map<String, Integer> numeroPorPedidoLoja = new HashMap<>();

        for (PedidoProdutos item : pendentes) {
            if (item.getLojista() == null || item.getPedido() == null) continue;
            Integer lojistaId = item.getLojista().getId();
            String chave = item.getPedido().getId() + ":" + lojistaId;

            Integer numero = numeroPorPedidoLoja.get(chave);
            if (numero == null) {
                int ultimo = ultimoPorLoja.computeIfAbsent(lojistaId,
                        pedidoProdutosRepository::maiorNumeroPedidoDaLoja);
                numero = ultimo + 1;
                ultimoPorLoja.put(lojistaId, numero);
                numeroPorPedidoLoja.put(chave, numero);
            }
            item.setNumeroPedidoLoja(numero);
        }

        pedidoProdutosRepository.saveAll(pendentes);
        log.info("Numeração por loja preenchida em {} itens de pedido", pendentes.size());
    }

    private void preencherCodigos() {
        List<PedidoProdutos> alterados = new ArrayList<>();
        for (PedidoProdutos item : pedidoProdutosRepository.findByCodigoPedidoLojaIsNullAndNumeroPedidoLojaIsNotNull()) {
            String sigla = item.getLojista() != null ? item.getLojista().getSigla() : null;
            if (sigla == null) continue;
            item.setCodigoPedidoLoja(sigla + "-" + item.getNumeroPedidoLoja());
            alterados.add(item);
        }
        if (alterados.isEmpty()) return;
        pedidoProdutosRepository.saveAll(alterados);
        log.info("Código do pedido na loja preenchido em {} itens", alterados.size());
    }
}
