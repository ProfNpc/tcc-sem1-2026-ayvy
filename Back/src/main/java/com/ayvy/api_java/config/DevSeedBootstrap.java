package com.ayvy.api_java.config;


import com.ayvy.api_java.infrastructure.entities.*;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import com.ayvy.api_java.infrastructure.enums.StatusProduto;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import com.ayvy.api_java.infrastructure.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Popula clientes, lojistas, categorias e produtos de exemplo em ambiente
 * de desenvolvimento.
 *
 * O seed pode ser executado várias vezes sem duplicar os registros.
 * Cada dado é criado somente se ainda não existir no banco.
 */
@Component
@Order(2)
public class DevSeedBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevSeedBootstrap.class);

    private static final String SENHA_PADRAO_LOJISTA = "senha123";

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final LojistaRepository lojistaRepository;
    private final EnderecoRepository enderecoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final PasswordEncoder passwordEncoder;

    public DevSeedBootstrap(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            LojistaRepository lojistaRepository,
            EnderecoRepository enderecoRepository,
            CategoriaRepository categoriaRepository,
            ProdutoRepository produtoRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.lojistaRepository = lojistaRepository;
        this.enderecoRepository = enderecoRepository;
        this.categoriaRepository = categoriaRepository;
        this.produtoRepository = produtoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {

        // ============================================================
        // CATEGORIAS
        // ============================================================

        Categoria roupas = categoria("Roupas", "roupas");
        Categoria calcados = categoria("Calçados", "calcados");
        Categoria acessorios = categoria("Acessórios", "acessorios");
        Categoria bolsas = categoria("Bolsas", "bolsas");

        // ============================================================
        // LOJISTAS
        // ============================================================

        Lojista lojaUrbana = criarLojista(
                "lojaurbana@ayvy.com.br",
                "Loja Urbana",
                "loja-urbana",
                "11111111000101",
                "Av. Paulista",
                "1000",
                "Bela Vista",
                "São Paulo",
                "SP",
                "01310100"
        );

        Lojista couroECia = criarLojista(
                "couroecia@ayvy.com.br",
                "Couro & Cia",
                "couro-e-cia",
                "22222222000102",
                "Rua da Assembleia",
                "50",
                "Centro",
                "Rio de Janeiro",
                "RJ",
                "20040020"
        );

        Lojista sneakHouse = criarLojista(
                "sneakhouse@ayvy.com.br",
                "SneakHouse",
                "sneakhouse",
                "33333333000103",
                "Av. Afonso Pena",
                "200",
                "Centro",
                "Belo Horizonte",
                "MG",
                "30130010"
        );

        Lojista bellaAcessorios = criarLojista(
                "bellaacessorios@ayvy.com.br",
                "Bella Acessórios",
                "bella-acessorios",
                "44444444000104",
                "Rua Chile",
                "10",
                "Centro",
                "Salvador",
                "BA",
                "40020000"
        );

        Lojista bolsasECia = criarLojista(
                "bolsasecia@ayvy.com.br",
                "Bolsas & Cia",
                "bolsas-e-cia",
                "55555555000105",
                "Rua XV de Novembro",
                "300",
                "Centro",
                "Curitiba",
                "PR",
                "80010000"
        );

        // ============================================================
        // PRODUTOS
        // ============================================================

        // Loja Urbana
        criarProduto(
                lojaUrbana,
                roupas,
                "Blusa Roxa",
                "blusa-roxa",
                "89.90",
                "Blusaroxa.png"
        );

        criarProduto(
                lojaUrbana,
                roupas,
                "Camisa Branca",
                "camisa-branca",
                "99.90",
                "camisaBranca.jpg"
        );

        criarProduto(
                lojaUrbana,
                roupas,
                "Blazer Alfaiataria",
                "blazer-alfaiataria",
                "189.90",
                "blazer_femino_alfaiataria.jpg"
        );

        criarProduto(
                lojaUrbana,
                roupas,
                "Tricot",
                "tricot",
                "119.90",
                "tricot.jpg"
        );

        criarProduto(
                lojaUrbana,
                roupas,
                "Vestido Floral",
                "vestido-floral",
                "139.90",
                "vestidofloral.jpg"
        );

        // Couro & Cia
        criarProduto(
                couroECia,
                roupas,
                "Jaqueta de Couro Preta",
                "jaqueta-couro-preta",
                "259.90",
                "Leather_Jacket.jpg"
        );

        criarProduto(
                couroECia,
                roupas,
                "Jaqueta de Couro Branca",
                "jaqueta-couro-branca",
                "249.90",
                "Leather_branca.jpg"
        );

        criarProduto(
                couroECia,
                roupas,
                "Jaqueta de Couro Vermelha",
                "jaqueta-couro-vermelha",
                "269.90",
                "red_leather.jpg"
        );

        // SneakHouse
        criarProduto(
                sneakHouse,
                calcados,
                "Tênis Samba Branco",
                "tenis-samba-branco",
                "449.90",
                "samba.jpg"
        );

        criarProduto(
                sneakHouse,
                calcados,
                "Tênis Samba Preto",
                "tenis-samba-preto",
                "449.90",
                "samba_preto.jpg"
        );

        criarProduto(
                sneakHouse,
                calcados,
                "Tênis New Balance Branco",
                "tenis-new-balance-branco",
                "599.90",
                "NBbranco.png"
        );

        criarProduto(
                sneakHouse,
                calcados,
                "Tênis Vans Old Skool",
                "tenis-vans-old-skool",
                "329.90",
                "vans.jpg"
        );

        criarProduto(
                sneakHouse,
                calcados,
                "Bota Amarela",
                "bota-amarela",
                "279.90",
                "BotaYellow.png"
        );

        // Bella Acessórios
        criarProduto(
                bellaAcessorios,
                acessorios,
                "Cinto Branco",
                "cinto-branco",
                "49.90",
                "cintoBranco.jpg"
        );

        criarProduto(
                bellaAcessorios,
                acessorios,
                "Cinto Marrom",
                "cinto-marrom",
                "49.90",
                "cintoMarrom.jpg"
        );

        criarProduto(
                bellaAcessorios,
                acessorios,
                "Boné Preto",
                "bone-preto",
                "59.90",
                "BonePreto.png"
        );

        criarProduto(
                bellaAcessorios,
                acessorios,
                "Meia Estampada",
                "meia-estampada",
                "19.90",
                "meia_estampa.jpg"
        );

        // Bolsas & Cia
        criarProduto(
                bolsasECia,
                bolsas,
                "Bolsa Azul",
                "bolsa-azul",
                "149.90",
                "bolsaazul.jpg"
        );

        criarProduto(
                bolsasECia,
                bolsas,
                "Bolsa Vermelha",
                "bolsa-vermelha",
                "159.90",
                "bolsared.jpg"
        );

        criarProduto(
                bolsasECia,
                bolsas,
                "Bolsa Tote",
                "bolsa-tote",
                "179.90",
                "bolsatote.jpg"
        );

        criarProduto(
                bolsasECia,
                bolsas,
                "Bolsa Preta",
                "bolsa-preta",
                "169.90",
                "bolsapreta.jpg"
        );

        // ============================================================
        // CLIENTES
        // ============================================================

        criarCliente(
                "Heloísa Dourado",
                "heloisa@ayvy.com.br",
                "heloisaayvy",
                "11111111111",
                "heloisa3.jpeg"
        );

        criarCliente(
                "Emilly Silva",
                "emilly@ayvy.com.br",
                "emillyayvy",
                "22222222222",
                "emilly2.jpeg"
        );

        criarCliente(
                "Guilherme Gomes",
                "guilherme@ayvy.com.br",
                "guilhermeayvy",
                "33333333333",
                "gui1.jpeg"
        );

        criarCliente(
                "Letícia Almeida",
                "leticia@ayvy.com.br",
                "leticiaayvy",
                "44444444444",
                "leticia1.jpeg"
        );

        log.info("DevSeedBootstrap: seed finalizado. Registros existentes foram reutilizados e registros ausentes foram criados.");
    }

    // ============================================================
    // CATEGORIA
    // ============================================================

    private Categoria categoria(String nome, String slug) {

        Optional<Categoria> categoriaExistente =
                categoriaRepository.findBySlug(slug);

        if (categoriaExistente.isPresent()) {
            log.info(
                    "DevSeedBootstrap: categoria '{}' já existe. Reutilizando.",
                    slug
            );

            return categoriaExistente.get();
        }

        Categoria novaCategoria = Categoria.builder()
                .nome(nome)
                .slug(slug)
                .ativo(true)
                .build();

        log.info(
                "DevSeedBootstrap: criando categoria '{}'.",
                slug
        );

        return categoriaRepository.saveAndFlush(novaCategoria);
    }

    // ============================================================
    // LOJISTA
    // ============================================================

    private Lojista criarLojista(
            String email,
            String nomeLoja,
            String slug,
            String cnpj,
            String logradouro,
            String numero,
            String bairro,
            String cidade,
            String uf,
            String cep) {

        /*
         * Primeiro procuramos o usuário pelo e-mail.
         *
         * Se ele já existir, reutilizamos o usuário existente.
         * Isso evita criar uma segunda conta para o mesmo lojista.
         */
        Optional<Usuario> usuarioExistente =
                usuarioRepository.findByEmail(email);

        Usuario usuario;

        if (usuarioExistente.isPresent()) {

            usuario = usuarioExistente.get();

            log.info(
                    "DevSeedBootstrap: usuário lojista '{}' já existe. Reutilizando.",
                    email
            );

        } else {

            usuario = usuarioRepository.saveAndFlush(
                    Usuario.builder()
                            .papel(PapelUsuario.lojista)
                            .nome(nomeLoja)
                            .email(email)
                            .senha(passwordEncoder.encode(SENHA_PADRAO_LOJISTA))
                            .status(StatusUsuario.ativo)
                            .build()
            );

            log.info(
                    "DevSeedBootstrap: usuário lojista '{}' criado.",
                    email
            );
        }

        /*
         * Procuramos o lojista pelo slug.
         */
        Optional<Lojista> lojistaExistente =
                lojistaRepository.findBySlug(slug);

        if (lojistaExistente.isPresent()) {

            log.info(
                    "DevSeedBootstrap: lojista '{}' já existe. Reutilizando.",
                    slug
            );

            return lojistaExistente.get();
        }

        /*
         * Caso o usuário já existisse, mas o lojista ainda não,
         * criamos somente o registro de lojista.
         */
        Lojista lojista = lojistaRepository.saveAndFlush(
                Lojista.builder()
                        .usuario(usuario)
                        .nomeLoja(nomeLoja)
                        .slug(slug)
                        .cnpj(cnpj)
                        .status(StatusLoja.aprovado)
                        .build()
        );

        /*
         * Cria o endereço somente se ainda não existir
         * um endereço principal para esse usuário.
         */
        if (enderecoRepository.findByUsuarioIdAndPrincipalTrue(usuario.getId()).isEmpty()) {

            enderecoRepository.saveAndFlush(
                    Endereco.builder()
                            .usuario(usuario)
                            .logradouro(logradouro)
                            .numero(numero)
                            .bairro(bairro)
                            .cidade(cidade)
                            .uf(uf)
                            .cep(cep)
                            .principal(true)
                            .build()
            );

            log.info(
                    "DevSeedBootstrap: endereço principal da loja '{}' criado.",
                    nomeLoja
            );
        }

        log.info(
                "DevSeedBootstrap: lojista '{}' criado.",
                nomeLoja
        );

        return lojista;
    }

    // ============================================================
    // PRODUTO
    // ============================================================

    private void criarProduto(
            Lojista lojista,
            Categoria categoria,
            String nome,
            String slug,
            String preco,
            String nomeArquivoImagem) {

        /*
         * O slug identifica o produto do seed.
         *
         * Se o produto já existir, não criamos outro.
         */
        Optional<Produto> produtoExistente =
                produtoRepository.findBySlug(slug);

        if (produtoExistente.isPresent()) {

            log.info(
                    "DevSeedBootstrap: produto '{}' já existe. Reutilizando.",
                    slug
            );

            return;
        }

        produtoRepository.saveAndFlush(
                Produto.builder()
                        .lojista(lojista)
                        .categoria(categoria)
                        .nome(nome)
                        .slug(slug)
                        .preco(new BigDecimal(preco))
                        .estoque(10)
                        .imagemPrincipalUrl(
                                "/uploads/produtos/" + nomeArquivoImagem
                        )
                        .statusProduto(StatusProduto.ativo)
                        .build()
        );

        log.info(
                "DevSeedBootstrap: produto '{}' criado.",
                nome
        );
    }

    // ============================================================
    // CLIENTE
    // ============================================================

    private void criarCliente(
            String nomeCompleto,
            String email,
            String senha,
            String cpf,
            String avatarArquivo) {

        /*
         * Primeiro verificamos se já existe um usuário com esse e-mail.
         */
        Optional<Usuario> usuarioExistente =
                usuarioRepository.findByEmail(email);

        Usuario usuario;

        if (usuarioExistente.isPresent()) {

            usuario = usuarioExistente.get();

            log.info(
                    "DevSeedBootstrap: usuário cliente '{}' já existe. Reutilizando.",
                    email
            );

        } else {

            usuario = usuarioRepository.saveAndFlush(
                    Usuario.builder()
                            .papel(PapelUsuario.cliente)
                            .nome(nomeCompleto)
                            .email(email)
                            .senha(passwordEncoder.encode(senha))
                            .status(StatusUsuario.ativo)
                            .avatarUrl(
                                    "/uploads/usuarios/" + avatarArquivo
                            )
                            .build()
            );

            log.info(
                    "DevSeedBootstrap: usuário cliente '{}' criado.",
                    email
            );
        }

        /*
         * Verificamos primeiro se já existe um Cliente
         * vinculado a este usuário.
         *
         * Isso evita o erro de UNIQUE em usuario_id.
         */
        Optional<Cliente> clientePorUsuario =
                clienteRepository.findByUsuario_Id(usuario.getId());

        if (clientePorUsuario.isPresent()) {

            log.info(
                    "DevSeedBootstrap: cliente do usuário '{}' já existe. Reutilizando.",
                    email
            );

            return;
        }

        /*
         * Caso não exista um cliente para este usuário,
         * verificamos também se o CPF já está cadastrado.
         */
        Optional<Cliente> clientePorCpf =
                clienteRepository.findByCpf(cpf);

        if (clientePorCpf.isPresent()) {

            log.info(
                    "DevSeedBootstrap: cliente com CPF '{}' já existe. Reutilizando.",
                    cpf
            );

            return;
        }

        /*
         * Se não existe cliente pelo usuário nem pelo CPF,
         * criamos um novo registro.
         */
        clienteRepository.saveAndFlush(
                Cliente.builder()
                        .usuario(usuario)
                        .cpf(cpf)
                        .build()
        );

        log.info(
                "DevSeedBootstrap: cliente '{}' criado.",
                nomeCompleto
        );
    }
}

