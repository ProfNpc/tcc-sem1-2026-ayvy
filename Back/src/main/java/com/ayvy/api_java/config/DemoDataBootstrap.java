package com.ayvy.api_java.config;

import com.ayvy.api_java.business.SiglaLojaService;
import com.ayvy.api_java.infrastructure.entities.*;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import com.ayvy.api_java.infrastructure.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Complementa os dados de demonstração da AYVY depois da criação da árvore de
 * categorias. Não altera fotos de clientes, não sobrescreve dados preenchidos
 * manualmente e identifica os pedidos gerados por uma chave estável para que
 * o bootstrap possa ser executado repetidamente sem duplicações.
 * Cores, tamanhos e estoque dos produtos são criados como ProdutoVariacoes.
 */
@Component
@Profile("!prod")
@Order(5)
public class DemoDataBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataBootstrap.class);
    private static final String MARCADOR_PEDIDO = "AYVY_DEMO_SEED_V1";

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final LojistaRepository lojistaRepository;
    private final EnderecoRepository enderecoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final ProdutoVariacaoRepository produtoVariacaoRepository;
    private final FavoritosRepository favoritosRepository;
    private final PedidoRepository pedidoRepository;
    private final PedidoProdutosRepository pedidoProdutosRepository;
    private final PedidoEnderecoEntregaRepository pedidoEnderecoEntregaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final HistoricoComprasRepository historicoComprasRepository;
    private final SiglaLojaService siglaLojaService;

    public DemoDataBootstrap(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            LojistaRepository lojistaRepository,
            EnderecoRepository enderecoRepository,
            CategoriaRepository categoriaRepository,
            ProdutoRepository produtoRepository,
            ProdutoVariacaoRepository produtoVariacaoRepository,
            FavoritosRepository favoritosRepository,
            PedidoRepository pedidoRepository,
            PedidoProdutosRepository pedidoProdutosRepository,
            PedidoEnderecoEntregaRepository pedidoEnderecoEntregaRepository,
            PagamentoRepository pagamentoRepository,
            HistoricoComprasRepository historicoComprasRepository,
            SiglaLojaService siglaLojaService) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.lojistaRepository = lojistaRepository;
        this.enderecoRepository = enderecoRepository;
        this.categoriaRepository = categoriaRepository;
        this.produtoRepository = produtoRepository;
        this.produtoVariacaoRepository = produtoVariacaoRepository;
        this.favoritosRepository = favoritosRepository;
        this.pedidoRepository = pedidoRepository;
        this.pedidoProdutosRepository = pedidoProdutosRepository;
        this.pedidoEnderecoEntregaRepository = pedidoEnderecoEntregaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.historicoComprasRepository = historicoComprasRepository;
        this.siglaLojaService = siglaLojaService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Lojista> lojas = lojistaRepository.findAll();
        List<Cliente> clientes = clienteRepository.findAll();

        completarPerfilLojistas(lojas);
        completarEnderecosClientes(clientes);
        List<Produto> produtos = completarCatalogo();
        criarFavoritos(clientes, produtos);
        criarPedidosDemonstracao(clientes, lojas);

        log.info("DemoDataBootstrap concluído: {} clientes, {} lojas e {} produtos verificados.",
                clientes.size(), lojas.size(), produtoRepository.count());
    }

    private void completarPerfilLojistas(List<Lojista> lojas) {
        for (Lojista loja : lojas) {
            if (loja.getUsuario() == null) continue;
            Usuario usuario = loja.getUsuario();
            String slug = loja.getSlug();
            String arquivoAvatar = switch (slug) {
                case "loja-urbana" -> "seed-lojista-urbana.jpg";
                case "couro-e-cia" -> "seed-lojista-couro.jpg";
                case "sneakhouse" -> "seed-lojista-sneak.jpg";
                case "bella-acessorios" -> "seed-lojista-bella.jpg";
                case "bolsas-e-cia" -> "seed-lojista-bolsas.jpg";
                default -> "seed-lojista-urbana.jpg";
            };
            if (vazio(usuario.getAvatarUrl())) {
                usuario.setAvatarUrl("/uploads/usuarios/" + arquivoAvatar);
                usuarioRepository.save(usuario);
            }
            String slugArquivo = switch (slug == null ? "" : slug) {
                case "loja-urbana", "couro-e-cia", "sneakhouse", "bella-acessorios", "bolsas-e-cia" -> slug;
                default -> "demo-lojista";
            };
            if (vazio(loja.getLogoUrl())) loja.setLogoUrl("/uploads/lojistas/" + slugArquivo + "-logo.png");
            if (vazio(loja.getBannerUrl())) loja.setBannerUrl("/uploads/lojistas/" + slugArquivo + "-banner.jpg");
            if (vazio(loja.getDescricao())) {
                loja.setDescricao("Loja parceira da AYVY. Produtos selecionados com atendimento próximo e cuidado em cada pedido.");
            }
            if (loja.getAprovadoEm() == null) loja.setAprovadoEm(LocalDateTime.now().minusDays(90));
            siglaLojaService.garantirSigla(loja);
            lojistaRepository.save(loja);
        }
    }

    private void completarEnderecosClientes(List<Cliente> clientes) {
        for (Cliente cliente : clientes) {
            Usuario usuario = cliente.getUsuario();
            if (usuario == null) continue;
            boolean contaHeloisa = "heloisa@ayvy.com.br".equalsIgnoreCase(usuario.getEmail());
            Optional<Endereco> principal = enderecoRepository.findByUsuarioIdAndPrincipalTrue(usuario.getId());
            if (contaHeloisa && principal.isPresent()
                    && (!"São Paulo".equalsIgnoreCase(principal.get().getCidade())
                    || !"SP".equalsIgnoreCase(principal.get().getUf()))) {
                // Mantém o endereço anterior cadastrado, mas tira-o da posição principal
                // para que a conta de demonstração tenha Casa em São Paulo.
                principal.get().setPrincipal(false);
                enderecoRepository.save(principal.get());
                principal = Optional.empty();
            }
            if (principal.isPresent()) {
                Endereco endereco = principal.get();
                if (!"Casa".equalsIgnoreCase(endereco.getApelido())) {
                    endereco.setApelido("Casa");
                    enderecoRepository.save(endereco);
                }
            } else {
                enderecoRepository.saveAndFlush(enderecoCasaDemo(usuario));
            }

            if (contaHeloisa) {
                boolean jaExiste = enderecoRepository.findAll().stream()
                        .anyMatch(e -> e.getUsuario() != null
                                && e.getUsuario().getId().equals(usuario.getId())
                                && "Chácara".equalsIgnoreCase(e.getApelido()));
                if (!jaExiste) {
                    enderecoRepository.saveAndFlush(Endereco.builder()
                            .usuario(usuario)
                            .apelido("Chácara")
                            .logradouro("Estrada Municipal da Serra")
                            .numero("KM 8")
                            .complemento("Propriedade rural - endereço de demonstração")
                            .bairro("Zona Rural")
                            .cidade("Pirenópolis")
                            .uf("GO")
                            .cep("72980000")
                            .principal(false)
                            .build());
                }
            }
        }
    }

    private Endereco enderecoCasaDemo(Usuario usuario) {
        String email = usuario.getEmail() == null ? "" : usuario.getEmail().toLowerCase(Locale.ROOT);
        Endereco.EnderecoBuilder builder = Endereco.builder()
                .usuario(usuario).apelido("Casa").principal(true);
        if (email.startsWith("heloisa")) {
            return builder.logradouro("Rua Haddock Lobo").numero("595").bairro("Cerqueira César")
                    .cidade("São Paulo").uf("SP").cep("01414905").build();
        }
        if (email.startsWith("emilly")) {
            return builder.logradouro("Rua dos Pinheiros").numero("210").bairro("Pinheiros")
                    .cidade("São Paulo").uf("SP").cep("05422000").build();
        }
        if (email.startsWith("guilherme")) {
            return builder.logradouro("Avenida Afonso Pena").numero("350").bairro("Centro")
                    .cidade("Belo Horizonte").uf("MG").cep("30130003").build();
        }
        return builder.logradouro("Rua Chile").numero("80").bairro("Centro")
                .cidade("Salvador").uf("BA").cep("40020000").build();
    }

    private List<Produto> completarCatalogo() {
        adicionarProduto("loja-urbana", "Calça Wide Leg Clara", "calca-wide-leg-clara", "calcas-femininas",
                "189.90", "calca_wide.jpg", "Calça de caimento amplo e cintura alta.",
                List.of("34", "36", "38", "40", "42", "44"), List.of("Azul-claro"), 18);
        adicionarProduto("loja-urbana", "Top Canelado", "top-canelado", "tops-croppeds",
                "69.90", "top_canelado.jpg", "Top básico canelado para composições casuais.",
                List.of("PP", "P", "M", "G", "GG"), List.of("Preto"), 24);
        adicionarProduto("loja-urbana", "Colete de Linho", "colete-linho", "blazers-alfaiataria-feminina",
                "159.90", "colete.jpg", "Colete leve de inspiração em alfaiataria.",
                List.of("P", "M", "G", "GG"), List.of("Off-white"), 14);
        adicionarProduto("loja-urbana", "Macacão Cinza", "macacao-cinza", "macacoes-femininos",
                "219.90", "macacaoCinza.jpg", "Macacão de modelagem confortável.",
                List.of("P", "M", "G", "GG"), List.of("Cinza"), 12);
        adicionarProduto("loja-urbana", "Cropped de Renda", "cropped-renda", "tops-croppeds",
                "79.90", "cropped.jpg", "Cropped com detalhe em renda.",
                List.of("PP", "P", "M", "G"), List.of("Branco"), 16);

        adicionarProduto("couro-e-cia", "Jaqueta Jeans", "jaqueta-jeans", "jaquetas-casacos-masculinos",
                "229.90", "jaquetajeans.jpg", "Jaqueta jeans de visual clássico.",
                List.of("P", "M", "G", "GG", "XG"), List.of("Azul"), 15);
        adicionarProduto("couro-e-cia", "Jaqueta de Couro Marrom", "jaqueta-couro-marrom", "jaquetas-casacos-masculinos",
                "289.90", "Leather_Jacket2.jpg", "Jaqueta em estilo couro na tonalidade marrom.",
                List.of("P", "M", "G", "GG"), List.of("Marrom"), 10);
        adicionarProduto("couro-e-cia", "Jaqueta Vermelha", "jaqueta-vermelha-edicao", "jaquetas-casacos-masculinos",
                "279.90", "red_leather.jpg", "Jaqueta de destaque em vermelho.",
                List.of("P", "M", "G", "GG"), List.of("Vermelho"), 9);

        adicionarProduto("sneakhouse", "Tênis Samba Vinho", "tenis-samba-vinho", "tenis",
                "459.90", "samba_vinho.jpg", "Tênis casual de perfil baixo.",
                List.of("34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"), List.of("Vinho"), 20);
        adicionarProduto("sneakhouse", "Tênis New Balance Preto", "tenis-new-balance-preto", "tenis",
                "629.90", "NBpreto1.png", "Tênis esportivo em preto.",
                List.of("34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"), List.of("Preto"), 18);
        adicionarProduto("sneakhouse", "Tênis New Balance Cinza", "tenis-new-balance-cinza", "tenis",
                "619.90", "NBcinza2.png", "Tênis esportivo em tons de cinza.",
                List.of("34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"), List.of("Cinza"), 16);
        adicionarProduto("sneakhouse", "Sandália Minimalista Bege", "sandalia-minimalista-bege", "sandalias",
                "139.90", "sandaliabege.jpg", "Sandália de linhas minimalistas.",
                List.of("34", "35", "36", "37", "38", "39", "40"), List.of("Bege"), 12);
        adicionarProduto("sneakhouse", "Sandália Preta", "sandalia-preta", "sandalias",
                "119.90", "sandalia.jpg", "Sandália casual preta.",
                List.of("34", "35", "36", "37", "38", "39", "40"), List.of("Preto"), 12);

        adicionarProduto("bella-acessorios", "Boné Azul", "bone-azul", "bones-chapeus",
                "64.90", "BoneAzul.png", "Boné casual azul.", List.of("Único"), List.of("Azul"), 22);
        adicionarProduto("bella-acessorios", "Cinto Fino Preto", "cinto-fino-preto", "cintos",
                "54.90", "cintoFino.jpg", "Cinto fino para composições do dia a dia.",
                List.of("P", "M", "G"), List.of("Preto"), 20);
        adicionarProduto("bella-acessorios", "Meia Preta", "meia-preta", "meias",
                "24.90", "meia_preta.jpg", "Meia básica preta.",
                List.of("34-39", "40-44"), List.of("Preto"), 30);
        adicionarProduto("bella-acessorios", "Meia Floral", "meia-floral", "meias",
                "29.90", "meiaFlor.jpg", "Meia com estampa floral.",
                List.of("34-39", "40-44"), List.of("Branco"), 26);

        adicionarProduto("bolsas-e-cia", "Bolsa Branca", "bolsa-branca", "bolsas-femininas",
                "169.90", "bolsabranca.jpg", "Bolsa de ombro branca.", List.of("Único"), List.of("Branco"), 11);
        adicionarProduto("bolsas-e-cia", "Bolsa Bege", "bolsa-bege", "bolsas-femininas",
                "179.90", "bolsabege.jpg", "Bolsa neutra para uso diário.", List.of("Único"), List.of("Bege"), 13);
        adicionarProduto("bolsas-e-cia", "Bolsa Vinho", "bolsa-vinho", "bolsas-femininas",
                "189.90", "bolsared.jpg", "Bolsa de ombro em tom vinho.", List.of("Único"), List.of("Vinho"), 9);

        List<Produto> todos = produtoRepository.findAll();
        for (Produto produto : todos) completarCamposProdutoExistente(produto);
        return todos;
    }

    private void adicionarProduto(String slugLoja, String nome, String slug, String slugCategoria,
                                  String preco, String imagem, String descricao, List<String> tamanhos,
                                  List<String> cores, int estoque) {
        Optional<Produto> existente = produtoRepository.findBySlug(slug);
        if (existente.isPresent()) {
            Produto produto = existente.get();
            if (produto.getCategoria() == null) categoriaRepository.findBySlug(slugCategoria).ifPresent(produto::setCategoria);
            if (vazio(produto.getDescricao())) produto.setDescricao(descricao);
            if (produto.getEstoque() == null || produto.getEstoque() < 0) produto.setEstoque(estoque);
            if (vazio(produto.getImagemPrincipalUrl())) produto.setImagemPrincipalUrl("/uploads/produtos/" + imagem);
            produtoRepository.save(produto);
            garantirVariacoes(produto, tamanhos, cores, estoque);
            return;
        }
        Lojista loja = lojistaRepository.findBySlug(slugLoja).orElse(null);
        Categoria categoria = categoriaRepository.findBySlug(slugCategoria).orElse(null);
        if (loja == null || categoria == null) {
            log.warn("Produto de demonstração '{}' ignorado: loja ou categoria '{}' não encontrada.", slug, slugCategoria);
            return;
        }
        Produto produto = Produto.builder()
                .lojista(loja).categoria(categoria).nome(nome).slug(slug)
                .descricao(descricao).preco(new BigDecimal(preco)).estoque(estoque)
                .imagemPrincipalUrl("/uploads/produtos/" + imagem)
                .statusProduto(com.ayvy.api_java.infrastructure.enums.StatusProduto.ativo)
                .build();
        produto = produtoRepository.saveAndFlush(produto);
        garantirVariacoes(produto, tamanhos, cores, estoque);
    }

    /**
     * Cria uma variação para cada combinação tamanho x cor do produto, caso ele ainda não tenha nenhuma.
     * O estoque total informado é dividido entre as variações (mínimo de 2 peças cada, para os pedidos demo).
     */
    private void garantirVariacoes(Produto produto, List<String> tamanhos, List<String> cores, int estoqueTotal) {
        if (!produtoVariacaoRepository.findByProdutoId(produto.getId()).isEmpty()) return;
        List<String> listaTamanhos = (tamanhos == null || tamanhos.isEmpty()) ? List.of("Único") : tamanhos;
        List<String> listaCores = (cores == null || cores.isEmpty()) ? List.of("Conforme imagem") : cores;
        int totalVariacoes = listaTamanhos.size() * listaCores.size();
        int porVariacao = Math.max(2, estoqueTotal / totalVariacoes);
        for (String tamanho : listaTamanhos) {
            for (String cor : listaCores) {
                produtoVariacaoRepository.save(ProdutoVariacao.builder()
                        .produto(produto).tamanho(tamanho).cor(cor)
                        .estoque(porVariacao).ativo(true).build());
            }
        }
    }

    private void completarCamposProdutoExistente(Produto produto) {
        boolean alterado = false;
        if (produtoVariacaoRepository.findByProdutoId(produto.getId()).isEmpty() && produto.getCategoria() != null) {
            Categoria raiz = produto.getCategoria();
            while (raiz.getCategoriaPai() != null) raiz = raiz.getCategoriaPai();
            List<String> tamanhos = tamanhosPadrao(raiz.getSlug(), produto.getNome());
            int estoqueBase = produto.getEstoque() == null || produto.getEstoque() < 0 ? 10 : produto.getEstoque();
            garantirVariacoes(produto, tamanhos, List.of(corPadrao(produto.getNome())), estoqueBase);
        }
        if (vazio(produto.getDescricao())) {
            produto.setDescricao("Produto de demonstração da AYVY. Consulte as opções disponíveis e as informações da loja.");
            alterado = true;
        }
        if (produto.getEstoque() == null || produto.getEstoque() < 0) {
            produto.setEstoque(10);
            alterado = true;
        }
        if (alterado) produtoRepository.save(produto);
    }

    private String corPadrao(String nomeProduto) {
        String nome = nomeProduto == null ? "" : nomeProduto.toLowerCase(Locale.ROOT);
        if (nome.contains("off-white")) return "Off-white";
        if (nome.contains("branc")) return "Branco";
        if (nome.contains("pret")) return "Preto";
        if (nome.contains("rox")) return "Roxo";
        if (nome.contains("azul")) return "Azul";
        if (nome.contains("vermelh")) return "Vermelho";
        if (nome.contains("marrom")) return "Marrom";
        if (nome.contains("amarel")) return "Amarelo";
        if (nome.contains("cinza")) return "Cinza";
        if (nome.contains("floral") || nome.contains("estamp")) return "Estampado";
        if (nome.contains("bege")) return "Bege";
        return "Conforme imagem";
    }

    private List<String> tamanhosPadrao(String raiz, String nomeProduto) {
        String nome = nomeProduto == null ? "" : nomeProduto.toLowerCase(Locale.ROOT);
        if ("calcados".equals(raiz)) {
            if (nome.contains("bota")) return List.of("34", "35", "36", "37", "38", "39", "40");
            return List.of("34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44");
        }
        if ("bolsas".equals(raiz)) return List.of("Único");
        if ("acessorios".equals(raiz)) {
            if (nome.contains("meia")) return List.of("34-39", "40-44");
            if (nome.contains("boné") || nome.contains("bone")) return List.of("Único");
            if (nome.contains("cinto")) return List.of("P", "M", "G");
            return List.of();
        }
        if (nome.contains("calça") || nome.contains("calca")) return List.of("34", "36", "38", "40", "42", "44", "46");
        return List.of("PP", "P", "M", "G", "GG", "XG");
    }

    private void criarFavoritos(List<Cliente> clientes, List<Produto> produtos) {
        if (produtos.isEmpty()) return;
        for (Cliente cliente : clientes) {
            Usuario usuario = cliente.getUsuario();
            if (usuario == null) continue;
            int totalExistente = favoritosRepository.findByUsuarioId(usuario.getId()).size();
            int criados = totalExistente;
            if (criados >= 5) continue;
            for (Produto produto : produtos) {
                if (produto.getStatusProduto() == null || produto.getStatusProduto().name().equalsIgnoreCase("inativo")) continue;
                if (favoritosRepository.findByUsuarioIdAndProdutoId(usuario.getId(), produto.getId()).isPresent()) continue;
                favoritosRepository.save(Favoritos.builder().usuario(usuario).produto(produto).build());
                if (++criados >= 5) break;
            }
        }
    }

    private void criarPedidosDemonstracao(List<Cliente> clientes, List<Lojista> lojas) {
        // Cada loja recebe ao menos um pedido entregue, um em andamento e um cancelado.
        StatusPedido[] statusPorIndice = {
                StatusPedido.entregue,
                StatusPedido.em_separacao,
                StatusPedido.enviado,
                StatusPedido.cancelado
        };
        List<Endereco> enderecos = enderecoRepository.findAll();
        for (int ci = 0; ci < clientes.size(); ci++) {
            Cliente cliente = clientes.get(ci);
            Usuario usuario = cliente.getUsuario();
            if (usuario == null) continue;
            Endereco casa = enderecoPrincipal(enderecos, usuario.getId());
            Endereco chacara = enderecos.stream().filter(e -> e.getUsuario() != null
                    && e.getUsuario().getId().equals(usuario.getId())
                    && "Chácara".equalsIgnoreCase(e.getApelido())).findFirst().orElse(null);

            for (int si = 0; si < lojas.size(); si++) {
                Lojista loja = lojas.get(si);
                String marker = MARCADOR_PEDIDO + "|" + usuario.getEmail() + "|" + loja.getSlug();
                boolean existe = pedidoRepository.findAll().stream()
                        .anyMatch(p -> marker.equals(p.getObservacao()));
                if (existe) continue;

                List<Produto> produtosLoja = produtoRepository.findByLojistaId(loja.getId());
                if (produtosLoja.isEmpty()) continue;
                Produto produto = produtosLoja.get(Math.floorMod(ci + si, produtosLoja.size()));
                List<ProdutoVariacao> variacoes = produtoVariacaoRepository.findByProdutoIdAndAtivoTrue(produto.getId());
                if (variacoes.isEmpty()) continue;
                ProdutoVariacao variacao = variacoes.get(Math.min(1, variacoes.size() - 1));
                if (variacao.getEstoque() <= 0) variacao.setEstoque(5);

                StatusPedido status = statusPorIndice[Math.floorMod(ci + si, statusPorIndice.length)];
                // Pedido cancelado não consome estoque; os demais representam venda concluída/ativa.
                if (status != StatusPedido.cancelado) variacao.setEstoque(variacao.getEstoque() - 1);
                produtoVariacaoRepository.save(variacao);
                boolean pedidoChacara = "heloisa@ayvy.com.br".equalsIgnoreCase(usuario.getEmail()) && si == lojas.size() - 1 && chacara != null;
                Endereco destino = pedidoChacara ? chacara : casa;
                if (destino == null) continue;

                BigDecimal subtotal = produto.getPreco();
                BigDecimal frete = pedidoChacara ? new BigDecimal("100.00") : new BigDecimal("20.00");
                Pedido pedido = Pedido.builder().usuario(usuario).status(status)
                        .valorSubtotal(subtotal).valorFrete(frete).valorTotal(subtotal.add(frete))
                        .observacao(marker).build();
                if (status == StatusPedido.enviado || status == StatusPedido.entregue) {
                    pedido.setRecebidoEm(LocalDateTime.now().minusDays(3));
                    pedido.setEnviadoEm(LocalDateTime.now().minusDays(2));
                    pedido.setTransportadora("Correios");
                    pedido.setCodigoRastreio("AYVY" + String.format("%08d", Math.abs(marker.hashCode())));
                    pedido.setPrevisaoEntrega(LocalDate.now().plusDays(status == StatusPedido.entregue ? -1 : 2));
                    pedido.setLocalPostagem("Agência dos Correios - demonstração");
                    if (status == StatusPedido.entregue) pedido.setEntregueEm(LocalDateTime.now().minusDays(1));
                } else if (status == StatusPedido.em_separacao) {
                    pedido.setRecebidoEm(LocalDateTime.now().minusDays(1));
                }
                pedido = pedidoRepository.saveAndFlush(pedido);

                String sigla = loja.getSigla();
                if (vazio(sigla)) {
                    siglaLojaService.garantirSigla(loja);
                    lojistaRepository.saveAndFlush(loja);
                    sigla = loja.getSigla();
                }
                int numero = pedidoProdutosRepository.maiorNumeroPedidoDaLoja(loja.getId()) + 1;
                String codigo = sigla + "-" + numero;
                pedidoProdutosRepository.saveAndFlush(PedidoProdutos.builder()
                        .pedido(pedido).produto(produto).produtoVariacao(variacao).lojista(loja).quantidade(1)
                        .precoUnitario(produto.getPreco().doubleValue())
                        .tamanho(variacao.getTamanho()).cor(variacao.getCor())
                        .numeroPedidoLoja(numero).codigoPedidoLoja(codigo).build());

                pedidoEnderecoEntregaRepository.saveAndFlush(PedidoEnderecoEntrega.builder()
                        .pedido(pedido).logradouro(destino.getLogradouro()).numero(destino.getNumero())
                        .complemento(destino.getComplemento()).bairro(destino.getBairro())
                        .cidade(destino.getCidade()).uf(destino.getUf()).cep(destino.getCep()).build());

                pagamentoRepository.saveAndFlush(Pagamento.builder().pedido(pedido).valor(pedido.getValorTotal())
                        .tipo("cartao_credito")
                        .status(status == StatusPedido.cancelado ? "cancelado" : "aprovado")
                        .referencia("DEMO-" + codigo)
                        .pagoEm(status == StatusPedido.cancelado ? null : LocalDateTime.now().minusDays(2))
                        .build());

                historicoComprasRepository.saveAndFlush(HistoricoCompras.builder().pedido(pedido)
                        .evento("PEDIDO_DEMONSTRACAO").statusPedido(status.name())
                        .descricao("Pedido fictício criado pelo bootstrap para demonstração do fluxo AYVY.")
                        .actorUsuario(usuario).build());
            }
        }
    }

    private Endereco enderecoPrincipal(List<Endereco> enderecos, Integer usuarioId) {
        return enderecos.stream().filter(e -> e.getUsuario() != null
                && e.getUsuario().getId().equals(usuarioId)
                && Boolean.TRUE.equals(e.getPrincipal())).findFirst().orElse(null);
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}