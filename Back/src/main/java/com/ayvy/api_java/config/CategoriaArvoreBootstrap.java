package com.ayvy.api_java.config;

import com.ayvy.api_java.infrastructure.entities.Categoria;
import com.ayvy.api_java.infrastructure.entities.Produto;
import com.ayvy.api_java.infrastructure.repositories.CategoriaRepository;
import com.ayvy.api_java.infrastructure.repositories.ProdutoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Garante a árvore de categorias do marketplace (categoria principal → subcategorias).
 * Só cria o que falta (pelo slug) e nunca apaga categorias. Roda depois do DevSeedBootstrap
 * para mover os produtos de exemplo da categoria genérica "Roupas" para subcategorias.
 */
@Component
@Order(4)
public class CategoriaArvoreBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CategoriaArvoreBootstrap.class);

    private record Sub(String nome, String slug) {}

    private record Principal(String nome, String slug, String icone, List<Sub> subs) {}

    private static final List<Principal> ARVORE = List.of(
            new Principal("Moda Feminina", "moda-feminina", "fa-person-dress", List.of(
                    new Sub("Vestidos", "vestidos-femininos"),
                    new Sub("Vestidos de festa", "vestidos-de-festa"),
                    new Sub("Blusas, camisas e camisetas", "blusas-camisas-femininas"),
                    new Sub("Tops e croppeds", "tops-croppeds"),
                    new Sub("Saias", "saias"),
                    new Sub("Calças e jeans femininos", "calcas-femininas"),
                    new Sub("Shorts femininos", "shorts-femininos"),
                    new Sub("Macacões e macaquinhos", "macacoes-femininos"),
                    new Sub("Conjuntos femininos", "conjuntos-femininos"),
                    new Sub("Blazers e alfaiataria feminina", "blazers-alfaiataria-feminina"),
                    new Sub("Tricôs e malhas", "tricos-malhas-femininos"),
                    new Sub("Casacos e jaquetas femininas", "casacos-jaquetas-femininas"))),
            new Principal("Moda Masculina", "moda-masculina", "fa-user-tie", List.of(
                    new Sub("Camisetas e regatas masculinas", "camisetas-masculinas"),
                    new Sub("Camisas e polos masculinas", "camisas-masculinas"),
                    new Sub("Calças e jeans masculinos", "calcas-masculinas"),
                    new Sub("Bermudas", "bermudas-masculinas"),
                    new Sub("Moletons masculinos", "moletons-masculinos"),
                    new Sub("Jaquetas e casacos masculinos", "jaquetas-casacos-masculinos"),
                    new Sub("Ternos e blazers masculinos", "ternos-blazers-masculinos"),
                    new Sub("Conjuntos masculinos", "conjuntos-masculinos"))),
            new Principal("Moda Gestante", "moda-gestante", "fa-baby-carriage", List.of(
                    new Sub("Vestidos gestante", "vestidos-gestante"),
                    new Sub("Blusas gestante", "blusas-gestante"),
                    new Sub("Calças e leggings gestante", "calcas-gestante"),
                    new Sub("Moda amamentação", "moda-amamentacao"),
                    new Sub("Lingerie gestante", "lingerie-gestante"))),
            new Principal("Plus Size", "plus-size", "fa-ruler", List.of(
                    new Sub("Plus size feminino", "plus-size-feminino"),
                    new Sub("Plus size masculino", "plus-size-masculino"),
                    new Sub("Moda praia plus size", "moda-praia-plus-size"),
                    new Sub("Fitness plus size", "fitness-plus-size"))),
            new Principal("Moda Fitness e Academia", "moda-fitness", "fa-dumbbell", List.of(
                    new Sub("Roupas de academia feminina", "academia-feminina"),
                    new Sub("Roupas de academia masculina", "academia-masculina"),
                    new Sub("Roupas para corrida", "roupas-corrida"),
                    new Sub("Acessórios para academia", "acessorios-academia"))),
            new Principal("Moda Infantil", "moda-infantil", "fa-child", List.of(
                    new Sub("Roupas para meninas", "roupas-meninas"),
                    new Sub("Roupas para meninos", "roupas-meninos"),
                    new Sub("Calçados infantis", "calcados-infantis"),
                    new Sub("Pijamas infantis", "pijamas-infantis"),
                    new Sub("Moda praia infantil", "moda-praia-infantil"),
                    new Sub("Fantasias infantis", "fantasias-infantis"))),
            new Principal("Bebês", "bebes", "fa-baby", List.of(
                    new Sub("Bodies", "bodies-bebe"),
                    new Sub("Macacões para bebê", "macacoes-bebe"),
                    new Sub("Conjuntos para bebê", "conjuntos-bebe"),
                    new Sub("Sapatinhos", "sapatinhos-bebe"),
                    new Sub("Enxoval de bebê", "enxoval-bebe"))),
            new Principal("Moda Praia", "moda-praia", "fa-umbrella-beach", List.of(
                    new Sub("Biquínis", "biquinis"),
                    new Sub("Maiôs", "maios"),
                    new Sub("Sungas e shorts de praia", "sungas-shorts-praia"),
                    new Sub("Saídas de praia", "saidas-de-praia"))),
            new Principal("Pijamas e Moda Íntima", "pijamas-moda-intima", "fa-moon", List.of(
                    new Sub("Pijamas femininos", "pijamas-femininos"),
                    new Sub("Pijamas masculinos", "pijamas-masculinos"),
                    new Sub("Lingerie", "lingerie"),
                    new Sub("Cuecas", "cuecas"),
                    new Sub("Robes e camisolas", "robes-camisolas"))),
            new Principal("Streetwear", "streetwear", "fa-shirt", List.of(
                    new Sub("Camisetas oversized", "camisetas-oversized"),
                    new Sub("Moletons e hoodies", "moletons-hoodies"),
                    new Sub("Calças cargo", "calcas-cargo"),
                    new Sub("Jaquetas e corta-ventos", "jaquetas-corta-ventos"))),
            new Principal("Calçados", "calcados", "fa-shoe-prints", List.of(
                    new Sub("Tênis", "tenis"),
                    new Sub("Botas", "botas"),
                    new Sub("Sandálias", "sandalias"),
                    new Sub("Sapatos de salto", "sapatos-salto"),
                    new Sub("Sapatos sociais", "sapatos-sociais"),
                    new Sub("Chinelos e rasteiras", "chinelos-rasteiras"))),
            new Principal("Bolsas e Malas", "bolsas", "fa-bag-shopping", List.of(
                    new Sub("Bolsas femininas", "bolsas-femininas"),
                    new Sub("Mochilas", "mochilas"),
                    new Sub("Carteiras", "carteiras"),
                    new Sub("Malas de viagem", "malas-de-viagem"),
                    new Sub("Pochetes", "pochetes"))),
            new Principal("Acessórios", "acessorios", "fa-glasses", List.of(
                    new Sub("Cintos", "cintos"),
                    new Sub("Bonés e chapéus", "bones-chapeus"),
                    new Sub("Óculos", "oculos"),
                    new Sub("Relógios", "relogios"),
                    new Sub("Meias", "meias"),
                    new Sub("Lenços e cachecóis", "lencos-cachecois"))),
            new Principal("Joias e Bijuterias", "joias-bijuterias", "fa-gem", List.of(
                    new Sub("Colares", "colares"),
                    new Sub("Brincos", "brincos"),
                    new Sub("Anéis", "aneis"),
                    new Sub("Pulseiras", "pulseiras"))),
            new Principal("Beleza e Cuidados", "beleza-cuidados", "fa-wand-magic-sparkles", List.of(
                    new Sub("Maquiagem", "maquiagem"),
                    new Sub("Skincare", "skincare"),
                    new Sub("Cabelos", "cabelos"),
                    new Sub("Perfumes", "perfumes"),
                    new Sub("Unhas", "unhas"))),
            new Principal("Casa e Decoração", "casa-decoracao", "fa-couch", List.of(
                    new Sub("Decoração", "decoracao"),
                    new Sub("Cama, mesa e banho", "cama-mesa-banho"),
                    new Sub("Cozinha", "cozinha"),
                    new Sub("Organização", "organizacao"),
                    new Sub("Iluminação", "iluminacao"))),
            new Principal("Pets", "pets", "fa-paw", List.of(
                    new Sub("Roupas para pets", "roupas-pets"),
                    new Sub("Coleiras e guias", "coleiras-guias"),
                    new Sub("Caminhas e acessórios pet", "caminhas-acessorios-pet")))
    );

    /** Produtos de exemplo do DevSeedBootstrap que ficaram na categoria genérica "Roupas". */
    private static final Map<String, String> SUBCATEGORIA_DO_SEED = Map.ofEntries(
            Map.entry("blusa-roxa", "jaquetas-corta-ventos"),
            Map.entry("camisa-branca", "camisetas-masculinas"),
            Map.entry("blazer-alfaiataria", "blazers-alfaiataria-feminina"),
            Map.entry("tricot", "tricos-malhas-femininos"),
            Map.entry("vestido-floral", "vestidos-femininos"),
            Map.entry("jaqueta-couro-preta", "jaquetas-casacos-masculinos"),
            Map.entry("jaqueta-couro-branca", "jaquetas-casacos-masculinos"),
            Map.entry("jaqueta-couro-vermelha", "jaquetas-casacos-masculinos"),
            Map.entry("tenis-samba-branco", "tenis"),
            Map.entry("tenis-samba-preto", "tenis"),
            Map.entry("tenis-new-balance-branco", "tenis"),
            Map.entry("tenis-vans-old-skool", "tenis"),
            Map.entry("bota-amarela", "botas"),
            Map.entry("cinto-branco", "cintos"),
            Map.entry("cinto-marrom", "cintos"),
            Map.entry("bone-preto", "bones-chapeus"),
            Map.entry("meia-estampada", "meias"),
            Map.entry("bolsa-azul", "bolsas-femininas"),
            Map.entry("bolsa-vermelha", "bolsas-femininas"),
            Map.entry("bolsa-tote", "bolsas-femininas"),
            Map.entry("bolsa-preta", "bolsas-femininas")
    );

    /** Subcategorias que se repetiam: os produtos vão para a que ficou e a antiga é apagada. */
    private static final Map<String, String> MESCLADAS = Map.ofEntries(
            Map.entry("camisetas-femininas", "blusas-camisas-femininas"),
            Map.entry("jeans-feminino", "calcas-femininas"),
            Map.entry("camisas-polo", "camisas-masculinas"),
            Map.entry("jeans-masculino", "calcas-masculinas"),
            Map.entry("vestidos-plus-size", "plus-size-feminino"),
            Map.entry("jeans-plus-size", "plus-size-feminino"),
            Map.entry("leggings-calcas-fitness", "academia-feminina"),
            Map.entry("tops-esportivos", "academia-feminina"),
            Map.entry("conjuntos-fitness", "academia-feminina"),
            Map.entry("shorts-esportivos", "academia-masculina"),
            Map.entry("regatas-dry-fit", "academia-masculina")
    );

    private static final String SLUG_LEGADO_ROUPAS = "roupas";

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;

    public CategoriaArvoreBootstrap(CategoriaRepository categoriaRepository, ProdutoRepository produtoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.produtoRepository = produtoRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        int ordemPrincipal = 0;
        for (Principal p : ARVORE) {
            Categoria principal = garantir(p.nome(), p.slug(), null, p.icone(), ++ordemPrincipal);
            int ordemSub = 0;
            for (Sub s : p.subs()) {
                garantir(s.nome(), s.slug(), principal, null, ++ordemSub);
            }
        }
        mesclarRepetidas();
        moverProdutosDoSeed();
        desativarRoupasSeVazia();
    }

    private void mesclarRepetidas() {
        MESCLADAS.forEach((antigaSlug, novaSlug) -> categoriaRepository.findBySlug(antigaSlug).ifPresent(antiga ->
                categoriaRepository.findBySlug(novaSlug).ifPresent(nova -> {
                    for (Produto produto : produtoRepository.findByCategoriaId(antiga.getId())) {
                        produto.setCategoria(nova);
                        produtoRepository.save(produto);
                    }
                    categoriaRepository.delete(antiga);
                    log.info("CategoriaArvoreBootstrap: categoria '{}' juntada em '{}'", antigaSlug, novaSlug);
                })));
    }

    private Categoria garantir(String nome, String slug, Categoria pai, String icone, int ordem) {
        Categoria c = categoriaRepository.findBySlug(slug).orElseGet(() -> {
            log.info("CategoriaArvoreBootstrap: criando categoria '{}'", slug);
            return Categoria.builder().nome(nome).slug(slug).ativo(true).build();
        });
        boolean mudou = c.getId() == null;
        if (!nome.equals(c.getNome())) {
            c.setNome(nome);
            mudou = true;
        }
        Integer paiAtual = c.getCategoriaPai() == null ? null : c.getCategoriaPai().getId();
        Integer paiNovo = pai == null ? null : pai.getId();
        if (paiAtual == null ? paiNovo != null : !paiAtual.equals(paiNovo)) {
            c.setCategoriaPai(pai);
            mudou = true;
        }
        if (icone != null && !icone.equals(c.getIcone())) {
            c.setIcone(icone);
            mudou = true;
        }
        if (c.getOrdem() == null || c.getOrdem() != ordem) {
            c.setOrdem(ordem);
            mudou = true;
        }
        return mudou ? categoriaRepository.save(c) : c;
    }

    private void moverProdutosDoSeed() {
        SUBCATEGORIA_DO_SEED.forEach((produtoSlug, subSlug) -> {
            Produto produto = produtoRepository.findBySlug(produtoSlug).orElse(null);
            if (produto == null) return;
            Categoria atual = produto.getCategoria();
            boolean generica = atual == null
                    || SLUG_LEGADO_ROUPAS.equals(atual.getSlug())
                    || atual.getCategoriaPai() == null;
            if (!generica) return;
            categoriaRepository.findBySlug(subSlug).ifPresent(sub -> {
                if (atual != null && sub.getId().equals(atual.getId())) return;
                produto.setCategoria(sub);
                produtoRepository.save(produto);
                log.info("CategoriaArvoreBootstrap: produto '{}' movido para '{}'", produtoSlug, subSlug);
            });
        });
    }

    private void desativarRoupasSeVazia() {
        categoriaRepository.findBySlug(SLUG_LEGADO_ROUPAS).ifPresent(roupas -> {
            if (Boolean.TRUE.equals(roupas.getAtivo()) && !produtoRepository.existsByCategoriaId(roupas.getId())) {
                roupas.setAtivo(false);
                categoriaRepository.save(roupas);
                log.info("CategoriaArvoreBootstrap: categoria genérica 'roupas' sem produtos foi desativada");
            }
        });
    }
}
