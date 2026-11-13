# AYVY — TCC 2026 (marketplace de moda) · mapa geral

Marketplace em que **lojistas** publicam produtos, **clientes** compram (pelo site ou pelo app) e o **admin** acompanha tudo.
Este README é o **índice de tudo**. Cada assunto aponta para a **linha** do README da parte certa e para o código.
No topo de cada arquivo de código há um comentário explicando para que ele serve.

| Parte | Pasta | Tecnologia | Endereço | Guia completo |
|---|---|---|---|---|
| Site (front) | `ayvy-react/` | React 19 + Vite | http://localhost:5173 | [ayvy-react/README.md](ayvy-react/README.md) |
| API (back) | `back/` | Spring Boot 4 (Java 25) | http://localhost:8082 | [back/README.md](back/README.md) · [README-GUIA](back/README-GUIA.md) |
| Banco de dados | `database/` | SQL Server 2022 (Docker) | `localhost,1433` · banco `ayvy` | [database/README.md](database/README.md) |
| App (celular) | `mobile/login-app/` | Expo / React Native | Expo Go ou navegador | [mobile/login-app/README.md](mobile/login-app/README.md) |
| Painel admin | `ayvy-react/src/pages/Adim/` | React | http://localhost:5173/admin | [README-ADMIN.md](ayvy-react/src/pages/Adim/README-ADMIN.md) |

`IMAGENS/` guarda as fotos dos produtos de exemplo, que a API copia para `back/uploads` ao subir. `NÃO-UTILIZADO/` é código antigo.

## Índice

1. [Como rodar tudo](#1-como-rodar-tudo)
2. [Como as partes conversam](#2-como-as-partes-conversam)
3. [Índice por assunto (onde está cada coisa)](#3-índice-por-assunto-onde-está-cada-coisa)
4. [Onde mais dá erro](#4-onde-mais-dá-erro)
5. [Contas de teste](#5-contas-de-teste)
6. [Git (atalhos do grupo)](#6-git-atalhos-do-grupo)

---

## 1. Como rodar tudo

```bash
docker compose up -d                  # 1) banco (na raiz)
cd back && ./mvnw spring-boot:run     # 2) API na porta 8082 (cria as tabelas e os dados de exemplo)
cd ayvy-react && npm install && npm run dev   # 3) site na porta 5173
cd mobile/login-app && npm install && npx expo start   # 4) app (opcional)
```

Detalhes: site [README front §1](ayvy-react/README.md#L25) · API [README back §1](back/README.md#L23) · banco [README banco §2](database/README.md#L28) · app [README app §1](mobile/login-app/README.md#L19).

## 2. Como as partes conversam

```
Site (ayvy-react/src/services/*.js) ─┐
                                     ├─ HTTP JSON → API Spring Boot (back/…/controller → business → repositories) → SQL Server
App  (mobile/login-app/api.js)  ─────┘
```

- Site → API: [README front §2](ayvy-react/README.md#L37) (tabela de cada função e endpoint em [§8](ayvy-react/README.md#L141)).
- Todas as rotas da API: [README back §4](back/README.md#L63).
- App → API: [README app §5](mobile/login-app/README.md#L81).
- Tabelas: [README banco §3](database/README.md#L34).

## 3. Índice por assunto (onde está cada coisa)

| Assunto | Parte | Explicação (README → linha) | Código principal |
|---|---|---|---|
| Rotas do site (todas as URLs) | Front | [front: Rotas](ayvy-react/README.md#L64) | [AppRoutes.jsx](ayvy-react/src/routes/AppRoutes.jsx#L41) |
| Login e sessão | Front · Back | [front: AuthContext](ayvy-react/README.md#L127) · [back: login](back/README.md#L67) | [AuthContext](ayvy-react/src/context/AuthContext/index.jsx#L134) · [UsuarioService.autenticar](back/src/main/java/com/ayvy/api_java/business/UsuarioService.java#L196) |
| Cadastro (2 passos) | Back | [README-GUIA §8](back/README-GUIA.md#L285) | [authApi.criarUsuario](ayvy-react/src/services/authApi.js#L19) |
| Recuperar senha (e-mail/SMS/console) | Front · Back | [front: Esqueci a senha](ayvy-react/README.md#L102) · [back: E-mail e SMS](back/README.md#L162) | [RecuperacaoSenhaService](back/src/main/java/com/ayvy/api_java/business/RecuperacaoSenhaService.java#L68) |
| Menu do topo e sanduíche | Front | [front: Componentes](ayvy-react/README.md#L110) | [Navbar](ayvy-react/src/components/Navbar/index.jsx#L16) |
| Rodapé padrão / Suporte | Front | [front: Footer](ayvy-react/README.md#L112) | [Footer](ayvy-react/src/components/Footer/index.jsx#L86) |
| Categorias (tela e árvore) | Front · Back · Banco | [front: Categorias](ayvy-react/README.md#L91) · [back: árvore](back/README.md#L127) · [banco: categorias](database/README.md#L43) | [Categorias/index.jsx](ayvy-react/src/pages/Categorias/index.jsx#L110) · [ARVORE](back/src/main/java/com/ayvy/api_java/config/CategoriaArvoreBootstrap.java#L32) |
| Cadastro de produto (categoria, desconto, tamanhos) | Front · Back | [front: Cadastro de produto](ayvy-react/README.md#L94) · [back: ProdutoService](back/README.md#L99) | [ProdutoNovo](ayvy-react/src/pages/Loja/ProdutoNovo/index.jsx#L58) · [getPrecoFinal](back/src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java#L141) |
| Loja do lojista e pedidos da loja | Front | [front: Loja](ayvy-react/README.md#L92) | [Loja/index.jsx](ayvy-react/src/pages/Loja/index.jsx#L157) |
| Checkout (pedido, frete, pagamento) | Front · Back | [front: Checkout](ayvy-react/README.md#L99) · [back: Compra](back/README.md#L134) | [finalizarCheckout](back/src/main/java/com/ayvy/api_java/business/PedidoService.java#L383) |
| Envio, rastreio e confirmar entrega | Front · Back | [front: Meus pedidos](ayvy-react/README.md#L100) · [back: Envio](back/README.md#L140) | [TrackingTimeline](ayvy-react/src/components/TrackingTimeline/index.jsx#L68) · [getEtapaEnvio](back/src/main/java/com/ayvy/api_java/infrastructure/entities/Pedido.java#L110) |
| Código do pedido por loja (`LU-1`) | Back · Banco | [back: SiglaLojaService](back/README.md#L104) · [banco: pedido_produtos](database/README.md#L49) | [pedidoNumero.js](ayvy-react/src/utils/pedidoNumero.js#L5) |
| Notificações (cliente, loja, admin) | Back | [back: PedidoService](back/README.md#L95) | [notificarAdmins](back/src/main/java/com/ayvy/api_java/business/PedidoService.java#L311) |
| Meu estoque (variações cor + tamanho, reposição, gráfico) | Front · Back · Banco | [front: Meu estoque](ayvy-react/README.md#L101) · [back: Estoque](back/README.md#L147) · [banco: produto_variacoes](database/README.md#L55) | [MeuEstoque](ayvy-react/src/pages/MeuEstoque/index.jsx#L59) · [estoqueApi](ayvy-react/src/services/estoqueApi.js#L23) · [PedidoService.baixarEstoque](back/src/main/java/com/ayvy/api_java/business/PedidoService.java#L357) |
| Carrinho igual no site e no app | Front · App · Back | [front: CartContext](ayvy-react/README.md#L131) · [app: carrinho e favoritos](mobile/login-app/README.md#L72) · [back: carrinho](back/README.md#L154) | [useCarrinhoDaConta](ayvy-react/src/context/CartContext/index.jsx#L160) · [CartContext do app](mobile/login-app/CartContext.js#L38) · [CarrinhoService](back/src/main/java/com/ayvy/api_java/business/CarrinhoService.java#L54) |
| Favoritos iguais no site e no app | Front · App | [app: favoritos](mobile/login-app/README.md#L79) | [Produto.toggleFavorite](ayvy-react/src/pages/Produto/index.jsx#L195) · [app toggleFavorite](mobile/login-app/HomeScreen.js#L335) |
| Importar carrinho pelo link do app | Front | [front: Utils](ayvy-react/README.md#L163) | [cartImport.js](ayvy-react/src/utils/cartImport.js#L65) |
| Painel admin | Front | [front: Admin › Pedidos](ayvy-react/README.md#L103) · [guia do admin](ayvy-react/src/pages/Adim/README-ADMIN.md#L1) | [AdminPedidosList](ayvy-react/src/pages/Adim/Pedidos/index.jsx#L200) |
| Fotos / uploads | Back | [back: ImagensSeedBootstrap](back/README.md#L129) | [UploadService](back/src/main/java/com/ayvy/api_java/business/UploadService.java#L52) |
| Frete | Back | [back: FreteService](back/README.md#L102) | [calcularFreteTotal](back/src/main/java/com/ayvy/api_java/business/FreteService.java#L44) |
| Escala da tela (Windows/Linux) | Front | [front: CSS e layout](ayvy-react/README.md#L172) | [index.css](ayvy-react/src/index.css#L21) |
| Tabelas do banco | Banco | [banco: tabelas](database/README.md#L34) | [ayvySQL_DER.sql](database/ayvySQL_DER.sql#L18) |
| Telas do app | App | [app: arquivos e telas](mobile/login-app/README.md#L53) | [App.js](mobile/login-app/App.js#L13) |
| Endereço da API no app (`.env.local`) | App | [app: para onde aponta](mobile/login-app/README.md#L39) | [API_BASE_URL](mobile/login-app/api.js#L16) |

## 4. Onde mais dá erro

| Problema | Onde está explicado |
|---|---|
| Site: "Não foi possível conectar à API", CORS, foto quebrada, comentário quebrando o build | [front §12](ayvy-react/README.md#L190) |
| API: DevTools/PasswordEncoder, uploads, erro 409, PUT parcial, `UNIQUE` com NULL | [back §10](back/README.md#L168) |
| Banco: DER × API, ordem do drop, senha do `sa` | [banco §6](database/README.md#L87) |
| App: endereço da API, `.env.local`, conta errada | [app §6](mobile/login-app/README.md#L92) |

## 5. Contas de teste

| Papel | E-mail | Senha | Onde é criada |
|---|---|---|---|
| Admin | `admin@ayvy.com.br` | `admin123` | [AdminBootstrap](back/src/main/java/com/ayvy/api_java/config/AdminBootstrap.java#L22) |
| Lojista (ex.: Loja Urbana) | `lojaurbana@ayvy.com.br` | `senha123` | [DevSeedBootstrap](back/src/main/java/com/ayvy/api_java/config/DevSeedBootstrap.java#L34) |
| Cliente (ex.: Heloísa) | `heloisa@ayvy.com.br` | `heloisaayvy` | [DevSeedBootstrap](back/src/main/java/com/ayvy/api_java/config/DevSeedBootstrap.java#L347) |

## 6. Git (atalhos do grupo)

```bash
git switch corrigido                 # trocar de branch

# levar um commit de uma branch para outra
git switch main                      # volte para a main, se não estiver nela
git log --oneline                    # copie o código do último commit
git switch corrigido
git cherry-pick d23adc5              # cole aqui o código do commit
git push
```
