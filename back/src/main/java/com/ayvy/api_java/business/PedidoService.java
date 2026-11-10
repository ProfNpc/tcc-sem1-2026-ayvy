package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.CheckoutRequest;
import com.ayvy.api_java.dto.EnvioRequest;
import com.ayvy.api_java.infrastructure.entities.*;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import com.ayvy.api_java.infrastructure.repositories.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;

/**
 * Coração das compras. Faz:
 * - checkout: valida estoque, calcula frete, grava pedido, itens (com código da loja ex.: LU-1) e endereço;
 * - fluxo de envio: atualizarStatus, confirmarRecebimento, registrarEnvio (local/transportadora/rastreio),
 * confirmarEntregaPeloCliente;
 * - histórico (tabela historico_compras) e notificações para cliente, lojistas e admins.
 * Chamado por PedidoController. A etapa da linha de envio é calculada em entities/Pedido.getEtapaEnvio().
 */
@Service

public class PedidoService {

    private final PedidoRepository repository;
    private final PedidoProdutosRepository pedidoProdutosRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoEnderecoEntregaRepository pedidoEnderecoEntregaRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistoricoComprasRepository historicoComprasRepository;
    private final FreteService freteService;
    private final NotificacoesRepository notificacoesRepository;
    private final LojistaRepository lojistaRepository;
    private final SiglaLojaService siglaLojaService;
    private final ProdutoVariacaoRepository produtoVariacaoRepository;

    public PedidoService(PedidoRepository repository, PedidoProdutosRepository pedidoProdutosRepository, ProdutoRepository produtoRepository, PedidoEnderecoEntregaRepository pedidoEnderecoEntregaRepository, UsuarioRepository usuarioRepository, HistoricoComprasRepository historicoComprasRepository, FreteService freteService, NotificacoesRepository notificacoesRepository, LojistaRepository lojistaRepository, SiglaLojaService siglaLojaService, ProdutoVariacaoRepository produtoVariacaoRepository) {

        this.notificacoesRepository = notificacoesRepository;
        this.lojistaRepository = lojistaRepository;
        this.siglaLojaService = siglaLojaService;
        this.repository = repository;
        this.pedidoProdutosRepository = pedidoProdutosRepository;
        this.produtoRepository = produtoRepository;
        this.pedidoEnderecoEntregaRepository = pedidoEnderecoEntregaRepository;
        this.usuarioRepository = usuarioRepository;
        this.historicoComprasRepository = historicoComprasRepository;
        this.freteService = freteService;
        this.produtoVariacaoRepository = produtoVariacaoRepository;
    }



    //CREATE
    public String salvarPedido(Pedido pedido){
        repository.saveAndFlush(pedido);
        return ("Pedido Confirmado!");
    }

    //READ
    public Pedido buscarPedidoPorId(Integer id){

        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado")
        );
    }

    public Pedido buscarPedidoPorCodigo(String codigo){
        String normalizado = codigo == null ? "" : codigo.trim().toUpperCase().replaceFirst("^#", "");
        return pedidoProdutosRepository.findByCodigoPedidoLoja(normalizado).stream()
                .findFirst()
                .map(PedidoProdutos::getPedido)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Pedido " + normalizado + " não encontrado"));
    }

    public List<Pedido> listarPedidos(){
        return repository.findAll();
    }

    public PedidoEnderecoEntrega buscarEnderecoPorPedidoId(Integer pedidoId){
        return pedidoEnderecoEntregaRepository.findById(pedidoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Endereço de entrega não encontrado para o pedido " + pedidoId));
    }

    public List<Pedido> listarPedidosPorUsuario(Integer usuarioId){
        return repository.findByUsuarioId(usuarioId);}


    public List<PedidoProdutos> listarItensPorPedidoId(Integer pedidoId){
        buscarPedidoPorId(pedidoId);
        return pedidoProdutosRepository.findByPedidoId(pedidoId);
    }

    //DELETE
    public String deletarPedidoPorId(Integer id){
        repository.deleteById(id);
        return ("pedido cancelado!");
    }

    // UPDATE DE STATUS
    @Transactional
    public Pedido atualizarStatus(Integer id, StatusPedido novoStatus, Integer actorUsuarioId) {
        Pedido pedido = buscarPedidoPorId(id);

        if (novoStatus == StatusPedido.entregue) {
            pedido.setEntregueEm(LocalDateTime.now());
        }

        StatusPedido anterior = pedido.getStatus();
        boolean estavaDevolvido = anterior == StatusPedido.cancelado || anterior == StatusPedido.reembolsado;
        boolean ficaDevolvido = novoStatus == StatusPedido.cancelado || novoStatus == StatusPedido.reembolsado;
        if (ficaDevolvido && !estavaDevolvido) {
            for (PedidoProdutos item : pedidoProdutosRepository.findByPedidoId(pedido.getId())) {
                devolverEstoque(item);
            }
        } else if (estavaDevolvido && !ficaDevolvido) {
            for (PedidoProdutos item : pedidoProdutosRepository.findByPedidoId(pedido.getId())) {
                baixarEstoque(item);
            }
        }

        pedido.setStatus(novoStatus);
        pedido = repository.save(pedido);

        registrarHistorico(pedido, "STATUS_ALTERADO",
                "Status alterado para " + novoStatus.name(), actorUsuarioId);

        ResumoPedido resumo = resumir(pedido);
        switch (novoStatus) {
            case pago -> {
                notificarCliente(pedido, "Pagamento confirmado",
                        "Recebemos o pagamento do pedido " + resumo.codigos() + ". A loja já foi avisada.");
                notificarLojistas(pedido, "Novo pedido",
                        "Você recebeu um novo pedido de " + resumo.cliente() + ". Confirme o recebimento em Pedidos da loja.");
                notificarAdmins("Pedido pago " + resumo.codigos(),
                        resumo.cliente() + " pagou " + resumo.valor() + " em " + resumo.lojas() + ".");
            }
            case em_separacao -> {
                notificarCliente(pedido, "Pedido em preparação",
                        "A loja está preparando o seu pedido.");
                notificarAdmins("Pedido em preparação " + resumo.codigos(),
                        resumo.lojas() + " começou a preparar o pedido de " + resumo.cliente() + ".");
            }
            case entregue -> {
                notificarCliente(pedido, "Pedido entregue",
                        "Seu pedido foi entregue. Aproveite!");
                notificarAdmins("Pedido entregue " + resumo.codigos(),
                        "Pedido de " + resumo.cliente() + " em " + resumo.lojas() + " marcado como entregue.");
            }
            case cancelado, reembolsado -> {
                String rotulo = novoStatus == StatusPedido.cancelado ? "cancelado" : "reembolsado";
                notificarCliente(pedido, "Pedido " + rotulo,
                        "O pedido " + resumo.codigos() + " foi " + rotulo + ".");
                notificarLojistas(pedido, "Pedido " + rotulo,
                        "O pedido de " + resumo.cliente() + " foi " + rotulo + ".");
                notificarAdmins("Pedido " + rotulo + " " + resumo.codigos(),
                        "Pedido de " + resumo.cliente() + " em " + resumo.lojas() + " foi " + rotulo + ".");
            }
            default -> notificarAdmins("Status do pedido " + resumo.codigos(),
                    "Pedido de " + resumo.cliente() + " em " + resumo.lojas() + " agora está " + novoStatus.name() + ".");
        }

        return pedido;
    }

    @Transactional
    public Pedido registrarEnvio(Integer id, EnvioRequest request) {
        Pedido pedido = buscarPedidoPorId(id);

        if (pedido.getStatus() != StatusPedido.pago && pedido.getStatus() != StatusPedido.em_separacao) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Só é possível enviar pedidos pagos ou em separação");
        }

        String localPostagem = textoOuNull(request.getLocalPostagem());
        if (localPostagem == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o endereço onde o pacote foi deixado");
        }
        String transportadora = textoOuNull(request.getTransportadora());
        String rastreio = textoOuNull(request.getCodigoRastreio());
        if (rastreio != null) {
            rastreio = rastreio.toUpperCase().replaceAll("[^A-Z0-9]", "");
        }
        String detalheRastreio = rastreio == null ? ""
                : " · " + (transportadora != null ? transportadora + " " : "") + rastreio;

        pedido.setLocalPostagem(localPostagem);
        pedido.setTransportadora(transportadora);
        pedido.setCodigoRastreio(rastreio);
        pedido.setPrevisaoEntrega(request.getPrevisaoEntrega());
        pedido.setObservacaoEnvio(textoOuNull(request.getObservacaoEnvio()));
        if (pedido.getRecebidoEm() == null) {
            pedido.setRecebidoEm(LocalDateTime.now());
        }
        pedido.setEnviadoEm(LocalDateTime.now());
        pedido.setStatus(StatusPedido.enviado);
        pedido = repository.save(pedido);

        registrarHistorico(pedido, "PEDIDO_DESPACHADO",
                "Pacote deixado em " + localPostagem + detalheRastreio, request.getActorUsuarioId());

        notificarCliente(pedido, "Pedido despachado",
                "Seu pedido foi despachado e já está a caminho" + detalheRastreio + ". Acompanhe o envio em Meus pedidos.");
        ResumoPedido resumo = resumir(pedido);
        notificarAdmins("Pedido despachado " + resumo.codigos(),
                resumo.lojas() + " despachou o pedido de " + resumo.cliente() + detalheRastreio
                        + ". Pacote deixado em " + localPostagem + ".");

        return pedido;
    }

    public Pedido confirmarRecebimento(Integer id, Integer actorUsuarioId) {
        Pedido pedido = buscarPedidoPorId(id);
        if (pedido.getStatus() != StatusPedido.pago) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Só é possível confirmar o recebimento de pedidos pagos");
        }
        pedido.setRecebidoEm(LocalDateTime.now());
        pedido = repository.save(pedido);

        registrarHistorico(pedido, "PEDIDO_RECEBIDO", "Loja confirmou o recebimento do pedido", actorUsuarioId);
        notificarCliente(pedido, "Pedido recebido pela loja",
                "A loja recebeu o seu pedido e logo vai começar a preparar.");
        ResumoPedido resumo = resumir(pedido);
        notificarAdmins("Pedido recebido pela loja " + resumo.codigos(),
                resumo.lojas() + " confirmou o recebimento do pedido de " + resumo.cliente() + ".");

        return pedido;
    }

    public Pedido confirmarEntregaPeloCliente(Integer id, Integer usuarioId) {
        Pedido pedido = buscarPedidoPorId(id);
        if (pedido.getUsuario() == null || !pedido.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente o cliente que fez o pedido pode confirmar a entrega");
        }
        if (pedido.getStatus() != StatusPedido.enviado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Só é possível confirmar a entrega de pedidos despachados");
        }
        pedido.setEntregueEm(LocalDateTime.now());
        pedido.setStatus(StatusPedido.entregue);
        pedido = repository.save(pedido);

        registrarHistorico(pedido, "ENTREGA_CONFIRMADA", "Cliente confirmou que recebeu o pedido", usuarioId);

        ResumoPedido resumo = resumir(pedido);
        notificarLojistas(pedido, "Entrega confirmada",
                resumo.cliente() + " confirmou que recebeu o pedido.");
        notificarAdmins("Pedido entregue " + resumo.codigos(),
                resumo.cliente() + " confirmou o recebimento do pedido de " + resumo.lojas() + ".");

        return pedido;
    }

    private record ResumoPedido(String codigos, String lojas, String cliente, String valor) {}

    private ResumoPedido resumir(Pedido pedido) {
        List<PedidoProdutos> itens = pedidoProdutosRepository.findByPedidoId(pedido.getId());
        Set<String> codigos = new LinkedHashSet<>();
        Set<String> lojas = new LinkedHashSet<>();
        for (PedidoProdutos item : itens) {
            if (item.getCodigoPedidoLoja() != null) codigos.add("#" + item.getCodigoPedidoLoja());
            if (item.getLojista() != null && item.getLojista().getNomeLoja() != null) {
                lojas.add(item.getLojista().getNomeLoja());
            }
        }
        String cliente = pedido.getUsuario() != null && pedido.getUsuario().getNome() != null
                ? pedido.getUsuario().getNome() : "Cliente";
        String valor = pedido.getValorTotal() != null
                ? "R$ " + pedido.getValorTotal().setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',')
                : "—";
        return new ResumoPedido(
                codigos.isEmpty() ? "#" + pedido.getId() : String.join(", ", codigos),
                lojas.isEmpty() ? "a loja" : String.join(", ", lojas),
                cliente,
                valor);
    }

    private void notificarLojistas(Pedido pedido, String titulo, String mensagem) {
        Map<Integer, String> codigoPorUsuario = new LinkedHashMap<>();
        Map<Integer, Usuario> usuarios = new HashMap<>();
        for (PedidoProdutos item : pedidoProdutosRepository.findByPedidoId(pedido.getId())) {
            Lojista lojista = item.getLojista();
            if (lojista == null || lojista.getUsuario() == null) continue;
            Usuario dono = lojista.getUsuario();
            usuarios.putIfAbsent(dono.getId(), dono);
            String codigo = item.getCodigoPedidoLoja() != null ? "#" + item.getCodigoPedidoLoja() : "#" + pedido.getId();
            codigoPorUsuario.putIfAbsent(dono.getId(), codigo);
        }
        codigoPorUsuario.forEach((usuarioId, codigo) -> salvarNotificacao(
                usuarios.get(usuarioId), titulo + " " + codigo, mensagem, "pedido_loja"));
    }

    private void notificarAdmins(String titulo, String mensagem) {
        for (Usuario admin : usuarioRepository.findByPapel(PapelUsuario.admin)) {
            salvarNotificacao(admin, titulo, mensagem, "pedido_admin");
        }
    }

    private void salvarNotificacao(Usuario usuario, String titulo, String mensagem, String tipo) {
        if (usuario == null) return;
        notificacoesRepository.save(Notificacoes.builder()
                .usuario(usuario)
                .titulo(limitar(titulo, 150))
                .mensagem(limitar(mensagem, 250))
                .tipo(tipo)
                .lida(false)
                .build());
    }

    private static String limitar(String texto, int max) {
        if (texto == null) return null;
        return texto.length() <= max ? texto : texto.substring(0, max - 1) + "…";
    }

    private static String textoOuNull(String valor) {
        if (valor == null) return null;
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    private void notificarCliente(Pedido pedido, String titulo, String mensagem) {
        salvarNotificacao(pedido.getUsuario(), titulo, mensagem, "pedido");
    }

    // ------------------------------------------------------------------ estoque (por variação)

    /** Cancelamento/reembolso: a peça volta para a variação comprada. */
    private void devolverEstoque(PedidoProdutos item) {
        if (item.getProdutoVariacao() == null || item.getQuantidade() == null) return;
        ProdutoVariacao variacao = produtoVariacaoRepository
                .buscarPorIdComBloqueio(item.getProdutoVariacao().getId())
                .orElse(null);
        if (variacao == null) return;
        variacao.setEstoque(variacao.getEstoque() + item.getQuantidade());
        produtoVariacaoRepository.save(variacao);
    }

    /** Pedido reativado depois de cancelado/reembolsado: tira do estoque de novo (se houver). */
    private void baixarEstoque(PedidoProdutos item) {
        if (item.getProdutoVariacao() == null || item.getQuantidade() == null) return;
        ProdutoVariacao variacao = produtoVariacaoRepository
                .buscarPorIdComBloqueio(item.getProdutoVariacao().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Variação do produto não encontrada"));
        if (variacao.getEstoque() < item.getQuantidade()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Estoque insuficiente para reativar o pedido: " + item.getProduto().getNome()
                            + " (" + variacao.getTamanho() + ", " + variacao.getCor() + ")");
        }
        variacao.setEstoque(variacao.getEstoque() - item.getQuantidade());
        produtoVariacaoRepository.save(variacao);
    }

    private void avisarReporEstoque(Produto produto, ProdutoVariacao variacao) {
        Lojista lojista = produto.getLojista();
        if (lojista == null) return;
        String nome = produto.getNome() + " (" + variacao.getTamanho() + ", " + variacao.getCor() + ")";
        salvarNotificacao(lojista.getUsuario(),
                "Repor estoque: " + nome,
                "Acabou o estoque de " + nome + ". Reponha ou desative a variação em Meu estoque.",
                "estoque");
    }

    @Transactional
    public Pedido finalizarCheckout(CheckoutRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario não encontrado"));

        if (request.getItens() == null || request.getItens().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "O carrinho está vazio");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<PedidoProdutos> itens = new ArrayList<>();

        for (var itemReq : request.getItens()) {
            if (itemReq.getProdutoId() == null || itemReq.getProdutoVariacaoId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Informe o produto e a variação selecionada");
            }
            if (itemReq.getQuantidade() == null || itemReq.getQuantidade() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Informe uma quantidade maior que zero");
            }

            Produto produto = produtoRepository.findById(itemReq.getProdutoId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Produto " + itemReq.getProdutoId() + " não encontrado"));

            //Para evitar compras simultâneas
            ProdutoVariacao variacao = produtoVariacaoRepository
                    .buscarPorIdComBloqueio(itemReq.getProdutoVariacaoId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Variação do produto não encontrada"));

            if (!variacao.getProduto().getId().equals(produto.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "A variação selecionada não pertence ao produto informado");
            }
            //Verifica se a variação está ativa
            if (!variacao.isAtivo()){
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "A variação selecionada não está disponível");
            }

            if (variacao.getEstoque() < itemReq.getQuantidade()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Estoque insuficiente para " + produto.getNome()
                                + " (" + variacao.getTamanho()
                                + ", " + variacao.getCor() + ")");
            }

            variacao.setEstoque(variacao.getEstoque() - itemReq.getQuantidade());
            produtoVariacaoRepository.save(variacao);

            //Avisa o lojista quando a variação acaba
            if (variacao.getEstoque() == 0) {
                avisarReporEstoque(produto, variacao);
            }

            //Preço com desconto (precoFinal): é o valor cobrado, nunca o que vem do front
            BigDecimal precoUnit = produto.getPrecoFinal();
            subtotal = subtotal.add(
                    precoUnit.multiply(BigDecimal.valueOf(itemReq.getQuantidade())));

            itens.add(PedidoProdutos.builder()
                    .produto(produto)
                    .produtoVariacao(variacao)
                    .lojista(produto.getLojista())
                    .quantidade(itemReq.getQuantidade())
                    .precoUnitario(precoUnit.doubleValue())
                    .cor(variacao.getCor())
                    .tamanho(variacao.getTamanho())
                    .build()
            );
        }

        if (request.getEnderecoEntrega() == null
                || request.getEnderecoEntrega().getCep() == null
                || request.getEnderecoEntrega().getCep().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Informe o endereço de entrega e o CEP");
        }
        //variavél local de cálculo para implementação no builder
        BigDecimal valorFrete = freteService.calcularFreteTotal(itens, request.getEnderecoEntrega().getCep());
        Pedido pedido = Pedido.builder()
                .usuario(usuario)
                .observacao(request.getObservacao())
                .valorSubtotal(subtotal)
                .valorFrete(valorFrete)
                .valorTotal(subtotal.add(valorFrete))
                .status(StatusPedido.aguardando_pagamento)
                .build();

        pedido = repository.saveAndFlush(pedido);

        //Gera numeração e código dos pedidos por loja
        Map<Integer, Integer> numeroPorLoja = new HashMap<>();
        for (var item : itens) {
            Lojista lojista = item.getLojista();
            if (lojista != null && lojista.getId() != null) {
                if (siglaLojaService.garantirSigla(lojista)) {
                    lojistaRepository.save(lojista);
                }
                Integer numero = numeroPorLoja.computeIfAbsent(lojista.getId(),
                        lid -> pedidoProdutosRepository.maiorNumeroPedidoDaLoja(lid) + 1);
                item.setNumeroPedidoLoja(numero);
                item.setCodigoPedidoLoja(lojista.getSigla() + "-" + numero);
            }
            item.setPedido(pedido);
            pedidoProdutosRepository.save(item);
        }

        var endereco = request.getEnderecoEntrega();
        PedidoEnderecoEntrega entrega = PedidoEnderecoEntrega.builder()
                .pedido(pedido)
                .logradouro(endereco.getLogradouro())
                .numero(endereco.getNumero())
                .complemento(endereco.getComplemento())
                .bairro(endereco.getBairro())
                .uf(endereco.getUf())
                .cep(endereco.getCep())
                .cidade(endereco.getCidade())
                .build();
        pedidoEnderecoEntregaRepository.save(entrega);

        registrarHistorico(pedido, "PEDIDO_CRIADO", "Pedido criado pelo cliente", usuario.getId());

        ResumoPedido resumo = resumir(pedido);
        notificarAdmins("Novo pedido " + resumo.codigos(),
                resumo.cliente() + " fez um pedido de " + resumo.valor() + " em " + resumo.lojas() + ".");

        return pedido;
    }
    //UPDATE
    // !!! Não será possível atualizar o Pedido uma vez feito
    // !!! Pórem PedidoAtualizado está aqui caso seja necessário no futuro
    /*
    public void atualizarPedidoPorId(Integer id, Pedido pedido){
        Pedido pedidoEntity = buscarPedidoPorId(id);

        Pedido pedidoAtualizado = Pedido.builder()
                .status(pedidoEntity.getStatus())
                .valor(pedidoEntity.getValor())
                .dataPedido(pedidoEntity.getDataPedido())
                .id(pedidoEntity.getId())
                .build();

        repository.saveAndFlush(pedidoAtualizado);
    }*/


    private void registrarHistorico(Pedido pedido, String evento, String descricao, Integer actorUsuarioId){
        Usuario actor = null;
        if (actorUsuarioId != null) {
            actor = usuarioRepository.findById(actorUsuarioId).orElse(null);
        }


        HistoricoCompras registro = HistoricoCompras.builder()
                .pedido(pedido)
                .evento(evento)
                .statusPedido(pedido.getStatus().name())
                .descricao(descricao)
                .actorUsuario(actor)
                .build();

        historicoComprasRepository.saveAndFlush(registro);
    }

    public List<HistoricoCompras> listarHistoricoPorPedidoId(Integer pedidoId){
        buscarPedidoPorId(pedidoId);
        return historicoComprasRepository.findByPedidoIdOrderByCriadoEmAsc(pedidoId);
    }
}