# AYVY — Site (React + Vite) · guia completo do front

O site do marketplace roda em **http://localhost:5173** e conversa com a API Spring Boot em **http://localhost:8082**.
Todo arquivo citado aqui tem um link para a linha exata. Clique para abrir. No topo de cada arquivo há um comentário
explicando para que ele serve.
Mapa geral do projeto (front + back + banco + app): [../README.md](../README.md).

## Índice

1. [Como rodar](#1-como-rodar)
2. [Como o site conversa com a API](#2-como-o-site-conversa-com-a-api)
3. [Pastas](#3-pastas)
4. [Rotas (todas as URLs do site)](#4-rotas-todas-as-urls-do-site)
5. [Telas (pages)](#5-telas-pages)
6. [Componentes](#6-componentes)
7. [Contextos: login e carrinho](#7-contextos-login-e-carrinho)
8. [Serviços → endpoints da API](#8-serviços--endpoints-da-api)
9. [Utils e hooks](#9-utils-e-hooks)
10. [CSS, layout e escala da tela](#10-css-layout-e-escala-da-tela)
11. [O que fica salvo no navegador](#11-o-que-fica-salvo-no-navegador)
12. [Pontos de atenção (onde mais dá erro)](#12-pontos-de-atenção-onde-mais-dá-erro)

---

## 1. Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # confere se o projeto compila
npm run lint     # ESLint
```

- A API precisa estar ligada antes (`cd back && ./mvnw spring-boot:run`).
- Endereço da API: variável `VITE_API_BASE_URL`; sem ela vale `http://localhost:8082` ([api.js](src/services/api.js#L13)).

## 2. Como o site conversa com a API

```
Tela (src/pages/...) → função em src/services/*.js → apiJson()/apiFetch() em src/services/api.js → HTTP → back
```

| Peça | Onde | O que faz |
|---|---|---|
| Base de todas as chamadas | [apiFetch](src/services/api.js#L32) | monta a URL, envia JSON e trata erro |
| Atalho JSON | [apiJson](src/services/api.js#L99) | transforma o `body` em JSON |
| API desligada | [mensagem "Não foi possível conectar"](src/services/api.js#L56) | aparece quando o back não responde |
| Erro da API | [leitura do `detail`](src/services/api.js#L66) | o back manda `{ detail: "mensagem" }`, e essa mensagem vira o erro mostrado na tela |
| Imagens `/uploads/...` | [resolveImageUrl](src/utils/imageUrl.js#L7) | junta o endereço da API com o caminho da foto |

## 3. Pastas

| Pasta | Para que serve |
|---|---|
| [`src/main.jsx`](src/main.jsx) → [`src/App.jsx`](src/App.jsx) | entrada: Router → AuthProvider → CartProvider → rotas + carrinho lateral ([ordem dos providers](src/main.jsx#L16)) |
| [`src/routes/AppRoutes.jsx`](src/routes/AppRoutes.jsx) | todas as URLs e quem pode acessar |
| `src/pages/` | uma pasta por tela (`index.jsx` + `style.css`) |
| `src/components/` | peças reutilizáveis (menu, rodapé, cards, diálogos, linha de envio) |
| `src/context/` | estado global: login (`AuthContext`) e carrinho (`CartContext`) |
| `src/services/` | **única camada que fala com a API** |
| `src/utils/`, `src/hooks/` | funções de apoio |
| `public/assets/` | CSS legado (`geral.css`, login, cadastro) e imagens fixas |

## 4. Rotas (todas as URLs do site)

| URL | Tela | Quem acessa | Linha da rota |
|---|---|---|---|
| `/` | [Home](src/pages/Home/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L45) |
| `/categorias?c=slug` | [Categorias](src/pages/Categorias/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L47) |
| `/sobre` · `/ranking` | [Sobre](src/pages/Sobre/index.jsx) · [Ranking](src/pages/Ranking/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L46) |
| `/loja/:slug` | [Loja](src/pages/Loja/index.jsx) (vitrine; para o dono: produtos, rascunhos e pedidos) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L99) |
| `/loja/:slug/p/:productId` | [Produto](src/pages/Produto/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L100) |
| `/loja/:slug/produto/novo` e `/:productId/editar` | [Cadastro de produto](src/pages/Loja/ProdutoNovo/index.jsx) | logado (dono) | [AppRoutes](src/routes/AppRoutes.jsx#L102) |
| `/meu-estoque` | [Meu estoque](src/pages/MeuEstoque/index.jsx) | **só lojista** | [AppRoutes](src/routes/AppRoutes.jsx#L81) |
| `/carrinho?itens=10:2,...` | [Carrinho](src/pages/Carrinho/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L88) |
| `/checkout` | [Checkout](src/pages/Checkout/index.jsx) | logado | [AppRoutes](src/routes/AppRoutes.jsx#L90) |
| `/pedido/sucesso` | [PedidoSucesso](src/pages/PedidoSucesso/index.jsx) | todos | [AppRoutes](src/routes/AppRoutes.jsx#L97) |
| `/meus-pedidos` | [MeusPedidos](src/pages/MeusPedidos/index.jsx) | logado | [AppRoutes](src/routes/AppRoutes.jsx#L57) |
| `/perfil` · `/favoritos` · `/notificacoes` | [Perfil](src/pages/Perfil/index.jsx) · [Favoritos](src/pages/Favoritos/index.jsx) · [Notificações](src/pages/Notificacoes/index.jsx) | logado | [AppRoutes](src/routes/AppRoutes.jsx#L49) |
| `/login` · `/cadastro` · `/esqueci-senha` | [Login](src/pages/Login/index.jsx) · [Cadastro](src/pages/Cadastro/index.jsx) · [EsqueciSenha](src/pages/EsqueciSenha/index.jsx) | todos (sem menu) | [AppRoutes](src/routes/AppRoutes.jsx#L146) |
| `/admin/*` | [Painel admin](src/pages/Adim/index.jsx) ([guia do admin](src/pages/Adim/README-ADMIN.md)) | **só admin** | [AppRoutes](src/routes/AppRoutes.jsx#L120) |

Proteção: [RequireAuth](src/components/RequireAuth/index.jsx#L8) (precisa de login) e
[RequireRole](src/components/RequireRole/index.jsx#L13) (precisa do papel certo).

## 5. Telas (pages)

| Tela | Arquivo | O que faz | Partes importantes |
|---|---|---|---|
| Home | [Home](src/pages/Home/index.jsx#L94) | banner, busca, todos os produtos juntos, Suporte AYVY | [rolar até o Suporte](src/pages/Home/index.jsx#L105) |
| Categorias | [Categorias](src/pages/Categorias/index.jsx#L110) | lista lateral + bolinhas (estilo SHEIN) | [categoria principal](src/pages/Categorias/index.jsx#L217), [subcategoria](src/pages/Categorias/index.jsx#L275) |
| Loja | [Loja](src/pages/Loja/index.jsx#L157) | vitrine e painel do dono | [botões do pedido](src/pages/Loja/index.jsx#L67), [despachar](src/pages/Loja/index.jsx#L398), [aviso "entrega confirmada"](src/pages/Loja/index.jsx#L220) |
| Despachar pedido | [DespacharModal](src/pages/Loja/DespacharModal.jsx#L24) | local da postagem, serviço e rastreio | [formato dos Correios](src/pages/Loja/DespacharModal.jsx#L18) |
| Cadastro de produto | [ProdutoNovo](src/pages/Loja/ProdutoNovo/index.jsx#L58) | fotos, categoria, preço, desconto, **estoque por cor e tamanho** (cada combinação vira uma variação) | [tabela de estoque por variação](src/pages/Loja/ProdutoNovo/index.jsx#L127), [preencher todas](src/pages/Loja/ProdutoNovo/index.jsx#L132), [máscara de preço](src/pages/Loja/ProdutoNovo/index.jsx#L37), [tamanhos de roupa/calçado](src/pages/Loja/ProdutoNovo/index.jsx#L329), [publicar](src/pages/Loja/ProdutoNovo/index.jsx#L156) |
| Escolha da categoria | [CategoriaPicker](src/pages/Loja/ProdutoNovo/CategoriaPicker.jsx#L13) | principal → subcategoria (+ categoria adicional) | [obrigatória para publicar](src/pages/Loja/ProdutoNovo/CategoriaPicker.jsx#L108) |
| Janela de sucesso | [SucessoModal](src/pages/Loja/ProdutoNovo/SucessoModal.jsx#L12) | "Produto cadastrado com sucesso!" | — |
| Produto | [Produto](src/pages/Produto/index.jsx#L54) | galeria, cor/tamanho, carrinho, favoritar | [favoritar (API)](src/pages/Produto/index.jsx#L195) |
| Carrinho | [Carrinho](src/pages/Carrinho/index.jsx#L63) | itens, frete, importação do app | [importação ?itens=](src/pages/Carrinho/index.jsx#L110) |
| Checkout | [Checkout](src/pages/Checkout/index.jsx#L52) | endereço, frete, pagamento e pedido | [cria o pedido](src/pages/Checkout/index.jsx#L429) |
| Meus pedidos | [MeusPedidos](src/pages/MeusPedidos/index.jsx#L120) | linha de envio, rastreio, confirmar entrega | [confirmar entrega](src/pages/MeusPedidos/index.jsx#L176) |
| Meu estoque | [MeuEstoque](src/pages/MeuEstoque/index.jsx#L59) | planilha por variação (produto + cor + tamanho), reposição, desativar/reativar, gráfico de vendas, Premium | [adicionar peças](src/pages/MeuEstoque/index.jsx#L202), [reativar](src/pages/MeuEstoque/index.jsx#L233), [atualizar](src/pages/MeuEstoque/index.jsx#L178), [gráfico](src/pages/MeuEstoque/index.jsx#L150), [editar quantidade](src/pages/MeuEstoque/index.jsx#L218) |
| Esqueci a senha | [EsqueciSenha](src/pages/EsqueciSenha/index.jsx#L16) | código por e-mail/SMS + nova senha | [pedir código](src/pages/EsqueciSenha/index.jsx#L50) |
| Admin › Pedidos | [AdminPedidosList](src/pages/Adim/Pedidos/index.jsx#L200) | todos os pedidos, histórico e atividade | [histórico](src/pages/Adim/Pedidos/index.jsx#L162) |

## 6. Componentes

| Componente | Arquivo | Para que serve |
|---|---|---|
| MainLayout | [MainLayout](src/components/MainLayout/index.jsx#L20) | menu + página + **rodapé padrão** em todas as telas públicas |
| Navbar | [Navbar](src/components/Navbar/index.jsx#L16) | topo no computador: logo (volta ao início), Sobre, Suporte, Categorias e menu sanduíche ([item Meu estoque](src/components/Navbar/index.jsx#L59)) |
| NavbarMobile | [NavbarMobile](src/components/NavbarMobile/index.jsx#L11) | menu do celular (inclui Categorias) |
| Footer | [Footer](src/components/Footer/index.jsx#L86) · [SupportSection](src/components/Footer/index.jsx#L23) | rodapé padrão e o bloco Suporte AYVY da home |
| Card | [Card](src/components/Card/index.jsx#L24) | card de produto/loja, preço com desconto, [imagem de reserva](src/components/Card/index.jsx#L15) |
| TrackingTimeline | [TrackingTimeline](src/components/TrackingTimeline/index.jsx#L68) | linha de envio com caminhão ([posição do caminhão](src/components/TrackingTimeline/index.jsx#L45)) |
| ConfirmDialog | [ConfirmDialog](src/components/ConfirmDialog/index.jsx#L8) | janela "Sim / Cancelar" |
| CartDrawer · NavCartButton | [CartDrawer](src/components/CartDrawer/index.jsx#L18) · [NavCartButton](src/components/NavCartButton/index.jsx#L9) | carrinho lateral e ícone com contador |
| CategoriaOptions | [CategoriaOptions](src/components/CategoriaOptions/index.jsx#L4) | opções de categoria agrupadas (form do admin) |
| BrandSlider · Banner | [BrandSlider](src/components/BrandSlider/index.jsx#L7) · [Banner](src/components/Banner/index.jsx#L7) | carrossel de marcas e banner da home |
| FloatingChat | [FloatingChat](src/components/FloatingChat/index.jsx#L13) | botão de chat com a loja |
| AdminLayout | [AdminLayout](src/components/AdminLayout/index.jsx#L12) | barra lateral do admin |
| Admin/* | [ImageUploadField](src/components/Admin/ImageUploadField.jsx#L12) · [ProdutoGaleriaField](src/components/Admin/ProdutoGaleriaField.jsx#L12) · [AdminFormShell](src/components/Admin/AdminFormShell.jsx#L7) | peças dos formulários do admin |
| Login/Cadastro/Logout | [LoginForm](src/components/LoginForm/index.jsx#L8) · [CadastroForm](src/components/CadastroForm/index.jsx#L10) · [LogoutModal](src/components/LogoutModal/index.jsx#L6) | formulários e "Deseja sair?" |
| Não usados (legado) | `components/LojistaLayout`, `pages/Lojista/Painel`, pastas com " 2" no nome | ficam só como referência |

## 7. Contextos: login e carrinho

**Login — [`AuthContext`](src/context/AuthContext/index.jsx)**
- Guarda a sessão em `localStorage` ([chave ayvy.auth](src/context/AuthContext/index.jsx#L16)).
- Uso: [useAuth()](src/context/AuthContext/index.jsx#L134) devolve `{ user, loggedIn, isAdmin, isLojista, isCliente, shopSlug, login, logout }`.

**Carrinho — [`CartContext`](src/context/CartContext/index.jsx)**

| Parte | Onde | O que faz |
|---|---|---|
| Sincronização com a conta | [useCarrinhoDaConta](src/context/CartContext/index.jsx#L160) | ao entrar junta com a conta; salva cada mudança; busca de novo ao voltar à aba e a cada 20 s; ao sair limpa o navegador |
| Juntar carrinhos | [juntarCarrinhos](src/context/CartContext/index.jsx#L128) | linhas iguais ficam com a **maior** quantidade (não conta em dobro) |
| Converter para a API | [linhaParaConta](src/context/CartContext/index.jsx#L116) · [linhaDaConta](src/context/CartContext/index.jsx#L96) | formato do `PUT /carrinho` e volta |
| Importar do app | [importLines](src/context/CartContext/index.jsx#L311) | usado pelo `?itens=` do carrinho |
| Frete | [calculateFreight](src/context/CartContext/index.jsx#L401) | ViaCEP + `POST /frete/calcular` |

## 8. Serviços → endpoints da API

| Arquivo | Função principal | Endpoint | Back |
|---|---|---|---|
| [`authApi.js`](src/services/authApi.js) | [loginUsuario](src/services/authApi.js#L12) · [criarUsuario](src/services/authApi.js#L19) | `POST /usuarios/login`, `POST /usuarios`, `/clientes`, `/lojistas` | `UsuarioController` |
| [`senhaApi.js`](src/services/senhaApi.js) | [solicitarCodigoSenha](src/services/senhaApi.js#L8) · [redefinirSenhaComCodigo](src/services/senhaApi.js#L12) | `POST /usuarios/recuperar-senha`, `/redefinir-senha` | `RecuperacaoSenhaService` |
| [`shopApi.js`](src/services/shopApi.js) | [loadShopsFromApi](src/services/shopApi.js#L23) · [precosDoProduto](src/services/shopApi.js#L89) | `GET /produtos`, `GET /lojistas` | `ProdutoController`, `LojistaController` |
| [`categoriasApi.js`](src/services/categoriasApi.js) | [listCategoriasApi](src/services/categoriasApi.js#L7) | `GET /categorias` | `CategoriaController` |
| [`lojistaApi.js`](src/services/lojistaApi.js) | [salvarProdutoLojista](src/services/lojistaApi.js#L197) · [atualizarProdutoLojista](src/services/lojistaApi.js#L291) · [listPedidosDoLojista](src/services/lojistaApi.js#L435) · [despacharPedidoLojista](src/services/lojistaApi.js#L467) | `/produtos`, `/upload`, `/pedidos/*` | `ProdutoService`, `PedidoService` |
| [`pedidosApi.js`](src/services/pedidosApi.js) | [checkoutPedido](src/services/pedidosApi.js#L8) · [registrarEnvioPedido](src/services/pedidosApi.js#L53) · [confirmarEntregaCliente](src/services/pedidosApi.js#L48) · [calcularFrete](src/services/pedidosApi.js#L57) | `/pedidos/*`, `/frete/calcular`, `/pagamentos` | `PedidoController`, `FreteController` |
| [`carrinhoApi.js`](src/services/carrinhoApi.js) | [salvarCarrinhoDaConta](src/services/carrinhoApi.js#L12) | `GET/PUT /carrinho?usuarioId=` | `CarrinhoController` |
| [`variacoesApi.js`](src/services/variacoesApi.js) | [listarVariacoesAtivas](src/services/variacoesApi.js#L13) · [criarVariacao](src/services/variacoesApi.js#L17) · [acharVariacao](src/services/variacoesApi.js#L44) | `/produtos/{id}/variacoes` (GET, `/ativas`, POST, PUT, PATCH `/desativar` e `/ativar`) | `ProdutoVariacaoController` |
| [`estoqueApi.js`](src/services/estoqueApi.js) | [listarPlanilhaDaLoja](src/services/estoqueApi.js#L23) · [adicionarPecas](src/services/estoqueApi.js#L44) · [relatorioEstoque](src/services/estoqueApi.js#L73) | variações de cada produto + `GET /estoque/relatorio` | `ProdutoVariacaoController`, `EstoqueController` |
| [`notificacoesApi.js`](src/services/notificacoesApi.js) | [listNotificacoesDoUsuario](src/services/notificacoesApi.js#L23) | `/notificacoes` | `NotificacoesController` |
| [`favoritosApi.js`](src/services/favoritosApi.js) | [favoritarProduto](src/services/favoritosApi.js#L17) | `/favoritos`, `/visualizacoes` | `FavoritosController` |
| [`adminApi.js`](src/services/adminApi.js) | [uploadImage](src/services/adminApi.js#L139) | CRUD do admin + `POST /upload` | vários |

## 9. Utils e hooks

| Arquivo | Função | Para que serve |
|---|---|---|
| [`checkoutItens.js`](src/utils/checkoutItens.js) | [montarItensDoCheckout](src/utils/checkoutItens.js#L9) | troca cor + tamanho de cada linha do carrinho pelo `produtoVariacaoId` e confere o estoque antes do checkout |
| [`cartImport.js`](src/utils/cartImport.js) | [parseItensParam](src/utils/cartImport.js#L23) · [montarImportacao](src/utils/cartImport.js#L65) | importar `?itens=` do app com estoque e avisos |
| [`categoriaArvore.js`](src/utils/categoriaArvore.js) | [montarArvoreCategorias](src/utils/categoriaArvore.js#L13) | categorias principal → subcategorias |
| [`scrollToSupport.js`](src/utils/scrollToSupport.js) | [rolarAteSuporte](src/utils/scrollToSupport.js#L62) · [subirParaInicio](src/utils/scrollToSupport.js#L75) | rolar até o Suporte / voltar ao topo |
| [`pedidoNumero.js`](src/utils/pedidoNumero.js) | [numeroPedidoLabel](src/utils/pedidoNumero.js#L5) | código `#LU-1` |
| [`cartHelpers.js`](src/utils/cartHelpers.js) | [cartLineKey](src/utils/cartHelpers.js#L39) | R$, CEP, chave da linha do carrinho |
| [`mockAuthUsers.js`](src/utils/mockAuthUsers.js) | [getPostLoginPath](src/utils/mockAuthUsers.js#L69) | papéis e destino depois do login (não tem usuários falsos) |
| [`viacep.js`](src/utils/viacep.js) · [`useCepLookup.js`](src/hooks/useCepLookup.js) | — | consulta de CEP |
| Legado (não usados) | `freightMock.js`, `rankingMock.js`, `shopOwnerStore.js`, objeto `SHOPS` de `lojistaData.js` | só referência; tudo vem da API |

## 10. CSS, layout e escala da tela

| Assunto | Onde | Explicação |
|---|---|---|
| Escala para monitores grandes (Windows/Linux) | [--app-zoom](src/index.css#L21) | a página cresce por inteiro acima de 1700 px de largura; alturas usam `calc(100vh / var(--app-zoom))` |
| Rodapé sempre no fim | [.main-layout](src/components/MainLayout/style.css#L8) | layout em coluna com altura mínima da tela |
| CSS legado global | [`public/assets/css/geral.css`](public/assets/css/geral.css) | menu, home, perfil (carregado no `index.html`) |

## 11. O que fica salvo no navegador

| Chave `localStorage` | Onde | O quê |
|---|---|---|
| `ayvy.auth` | AuthContext | sessão do usuário |
| `ayvy.cart.v2` / `ayvy.cart.owner` | CartContext | carrinho (cópia; logado, o oficial é o da conta) e de qual conta ele é |
| `ayvy.favorites.v1` | Produto | favoritos só de visitante (logado vale a API) |
| `ayvy.payment-methods.v1` | paymentMethodsStore | cartões salvos **só** no navegador |
| `ayvy.following.v1` | Loja | lojas seguidas |

## 12. Pontos de atenção (onde mais dá erro)

1. **"Não foi possível conectar à API"**: o back está desligado ou em outra porta. Suba com `./mvnw spring-boot:run` e confira `VITE_API_BASE_URL`.
2. **CORS**: o site precisa rodar em `localhost:5173` ou `5174` (liberados no `WebConfig` do back).
3. **Foto quebrada**: a pasta `back/uploads` não vai para o git. O back copia as fotos que faltam de `IMAGENS/` ao subir (`ImagensSeedBootstrap`), e o card mostra uma imagem de reserva.
4. **Comentário com `*/` no meio quebra o build**: por exemplo, escrever `pages/Adim/*/Form.jsx` dentro de `/** ... */` fecha o comentário antes da hora.
5. **Carrinho "voltando sozinho"**: logado, o carrinho oficial é o da conta (atualiza a cada 20 s). Para testar do zero, esvazie pelo site ou pelo app.
6. **Lint**: existem erros antigos da regra `react-hooks/set-state-in-effect` em algumas telas (Admin, Checkout, Perfil, Notificações). Eles não impedem o build.
7. **`--app-zoom` e `100vh`**: ao criar CSS com altura de tela, use `calc(100vh / var(--app-zoom, 1))`. Sem isso, a tela passa do limite em monitores grandes.
