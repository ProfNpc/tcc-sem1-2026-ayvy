# AYVY — site (React + Vite)

Site do marketplace. Roda em **http://localhost:5173** e consome a API Spring Boot em **http://localhost:8082**.
Mapa geral do projeto (front + back + banco): [../README.md](../README.md).

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint     # ESLint
```

Variável opcional: `VITE_API_BASE_URL` (padrão `http://localhost:8082`), lida em `src/services/api.js`.

---

## 1. Pastas — "eu quero X, abro Y"

| Pasta | Para que serve |
|---|---|
| `src/main.jsx` → `src/App.jsx` | Ponto de entrada: monta os providers (Auth, Cart), as rotas e o carrinho lateral |
| `src/routes/AppRoutes.jsx` | **Todas as URLs do site** e quem pode acessar cada uma |
| `src/pages/` | Uma pasta por tela (`index.jsx` + `style.css`) |
| `src/components/` | Pedaços reutilizáveis (menu, rodapé, cards, diálogos, linha de envio…) |
| `src/context/` | Estado global: `AuthContext` (quem está logado) e `CartContext` (carrinho e frete) |
| `src/services/` | **Única camada que fala com a API**: cada arquivo agrupa endpoints de um assunto |
| `src/utils/` | Funções auxiliares (formatação, árvore de categorias, código do pedido, importação do carrinho…) |
| `src/hooks/` | Hooks: `useCepLookup` (ViaCEP), `useExternalStylesOnce` (CSS das telas de login) |
| `src/index.css` | Ajustes globais e **escala da tela** (`--app-zoom`) para monitores grandes no Windows/Linux |
| `public/assets/css/geral.css` | CSS legado global (navbar, home, perfil), carregado no `index.html` |
| `public/assets/img/` | Imagens estáticas (logo, banners, fotos do Sobre) |

---

## 2. Rotas (`src/routes/AppRoutes.jsx`)

| URL | Tela (`src/pages/…`) | Acesso |
|---|---|---|
| `/` | `Home` — banner, busca, produtos por loja, Suporte AYVY | público |
| `/categorias` (`?c=slug`) | `Categorias` — lista lateral + bolinhas (estilo SHEIN) | público |
| `/sobre` | `Sobre` — equipe | público |
| `/ranking` | `Ranking` | público |
| `/loja/:slug` | `Loja` — vitrine; para o dono: produtos, rascunhos e **pedidos** | público / dono |
| `/loja/:slug/p/:productId` | `Produto` — página do produto (lápis de edição para o dono) | público |
| `/loja/:slug/produto/novo` e `/:productId/editar` | `Loja/ProdutoNovo` — cadastro/edição de produto | logado (dono) |
| `/carrinho` (`?itens=10:2,…`) | `Carrinho` — também importa o carrinho vindo do app | público |
| `/checkout` | `Checkout` — endereço, frete e pagamento | logado |
| `/pedido/sucesso` | `PedidoSucesso` | público |
| `/meus-pedidos` | `MeusPedidos` — linha de envio e **Confirmar entrega** | logado |
| `/perfil`, `/favoritos`, `/notificacoes` | `Perfil`, `Favoritos`, `Notificacoes` | logado |
| `/login`, `/cadastro`, `/esqueci-senha` | telas de autenticação (fora do layout com menu) | público |
| `/admin/*` | `Adim/*` — painel admin ([README-ADMIN.md](./src/pages/Adim/README-ADMIN.md)) | só papel **admin** (`RequireRole`) |

Proteções: `components/RequireAuth` manda para `/login` quem não está logado; `components/RequireRole` libera só o papel pedido.
O layout com menu e rodapé de todas as telas públicas é `components/MainLayout`.

---

## 3. Serviços → API (`src/services/`)

Todos usam `api.js` (`apiJson` / `apiFetch`), que monta a URL, envia JSON e converte erro do back (`{ detail }`) em `Error`.

| Arquivo | Assunto | Endpoints principais |
|---|---|---|
| `api.js` | Base de tudo (URL, headers, erros) | — |
| `authApi.js` | Login, cadastro e sessão | `POST /usuarios/login`, `POST /usuarios`, `/clientes`, `/lojistas`, `/enderecos` |
| `senhaApi.js` | Recuperar senha | `POST /usuarios/recuperar-senha`, `POST /usuarios/redefinir-senha` |
| `shopApi.js` | Vitrine pública (lojas + produtos ativos) | `GET /produtos`, `GET /lojistas` |
| `categoriasApi.js` | Árvore de categorias | `GET /categorias` |
| `lojistaApi.js` | Painel do lojista: produtos, fotos e pedidos da loja | `/produtos`, `/produtos/{id}/imagens`, `/upload`, `/pedidos/*` |
| `pedidosApi.js` | Checkout, frete, pagamentos, pedidos e envio | `/pedidos/*`, `/frete/calcular`, `/pagamentos`, `/enderecos` |
| `notificacoesApi.js` | Notificações (filtradas pelo usuário logado) | `/notificacoes` |
| `favoritosApi.js` | Favoritos e visualizações de produto | `/favoritos`, `/visualizacoes` |
| `adminApi.js` | CRUD do painel admin + upload | `/usuarios`, `/clientes`, `/lojistas`, `/produtos`, `/categorias`, `/upload` |

---

## 4. Estado guardado no navegador (`localStorage`)

| Chave | Onde | O que guarda |
|---|---|---|
| `ayvy.auth` | `context/AuthContext` | sessão do usuário logado (id, papel, loja…) |
| `ayvy.cart.v2` | `context/CartContext` | itens do carrinho (preço real vem da API no checkout) |
| `ayvy.favorites.v1` | `pages/Produto` | favoritos locais |
| `ayvy.following.v1` | `pages/Loja` | lojas seguidas |
| `ayvy.payment-methods.v1` | `utils/paymentMethodsStore.js` | cartões salvos (só no navegador, nunca vão para o admin) |

---

## 5. Componentes importantes (`src/components/`)

| Componente | Para que serve |
|---|---|
| `MainLayout` | Menu + página + **rodapé padrão** sempre no fim da tela |
| `Navbar` / `NavbarMobile` | Menu do topo e sanduíche (Início, **Categorias**, Painel admin, Minha loja, Perfil, Sobre, Sair) |
| `Footer` | Rodapé padrão e a seção `SupportSection` (Suporte AYVY da home) |
| `TrackingTimeline` | Linha de envio com caminhão (Recebido → Preparando → Despachado → Coletado → Em rota → Entregue) |
| `ConfirmDialog` | Janela branca de confirmação (Sim / Cancelar) |
| `CartDrawer` | Carrinho lateral |
| `CategoriaOptions` | `<option>`s de categoria agrupadas por categoria principal (form do admin) |
| `AdminLayout` | Barra lateral do painel admin |
| `RequireAuth` / `RequireRole` | Proteção de rotas |

Telas com peças próprias:
- `pages/Loja/DespacharModal.jsx`: formulário de despacho com local da postagem, serviço e código de rastreio.
- `pages/Loja/ProdutoNovo/CategoriaPicker.jsx`: escolha da categoria principal e da subcategoria no cadastro do produto.

---

## 6. Utils que valem saber (`src/utils/`)

| Arquivo | Para que serve |
|---|---|
| `cartHelpers.js` | formatar R$, CEP, cartão; chave de linha do carrinho |
| `cartImport.js` | ler `?itens=` do app, validar com a API, aplicar estoque e avisos |
| `categoriaArvore.js` | transformar `GET /categorias` em árvore (principal → subcategorias) |
| `pedidoNumero.js` | mostrar o código do pedido por loja (`#LU-1`) |
| `imageUrl.js` | transformar `/uploads/...` do back em URL completa |
| `mockAuthUsers.js` | papéis (`ROLES`), destino pós-login e regra "é dono da loja?" |
| `viacep.js` | consulta de CEP (ViaCEP) |
