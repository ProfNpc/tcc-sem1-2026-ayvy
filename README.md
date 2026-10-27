# AYVY — TCC 2026 (marketplace de moda)

Marketplace onde **lojistas** publicam produtos, **clientes** compram e o **admin** acompanha tudo.
Este README é o **mapa geral**: o que existe, onde fica e como as partes conversam.

| Parte | Pasta | Tecnologia | Endereço local | Guia detalhado |
|---|---|---|---|---|
| Site (front) | `ayvy-react/` | React 19 + Vite | http://localhost:5173 | [ayvy-react/README.md](./ayvy-react/README.md) |
| API (back) | `back/` | Spring Boot 4 (Java 25) | http://localhost:8082 | [back/README.md](./back/README.md) · [back/README-GUIA.md](./back/README-GUIA.md) |
| Banco de dados | `database/` | SQL Server 2022 (Docker) | `localhost:1433`, banco `ayvy` | [database/README.md](./database/README.md) |
| App (celular) | `mobile/login-app/` | Expo / React Native | Expo Go | [mobile/login-app/README.md](./mobile/login-app/README.md) |
| Painel admin | `ayvy-react/src/pages/Adim/` | React | http://localhost:5173/admin | [README-ADMIN.md](./ayvy-react/src/pages/Adim/README-ADMIN.md) |

Pastas `IMAGENS/` e `NÃO-UTILIZADO/` guardam material de apoio e código antigo; não fazem parte do sistema.

---

## 1. Como rodar tudo (ordem certa)

```bash
# 1) Banco (SQL Server no Docker) — na raiz do repositório
docker compose up -d
# cria o container + a database "ayvy" (database/init-ayvy.sql)

# 2) API — porta 8082 (cria/atualiza tabelas sozinha: ddl-auto=update)
cd back
./mvnw spring-boot:run

# 3) Site — porta 5173
cd ayvy-react
npm install
npm run dev
```

Na primeira subida, a API cria sozinha (classes em `back/.../config/`):

| Bootstrap | O que faz |
|---|---|
| `AdminBootstrap` | conta de administrador |
| `DevSeedBootstrap` | lojas, produtos e clientes de exemplo |
| `CategoriaArvoreBootstrap` | árvore de categorias (Moda Feminina → Vestidos…) |
| `PedidoNumeroLojaBootstrap` | sigla da loja e código do pedido (ex.: `LU-1`) |

---

## 2. Como front e back conversam (o caminho de uma chamada)

```
Tela React (pages/…)
  └─ função em ayvy-react/src/services/*.js      ex.: checkoutPedido(payload)
       └─ apiJson("/pedidos/checkout")           services/api.js (base http://localhost:8082)
            └─ HTTP → Controller (back/.../controller/PedidoController.java)
                 └─ Service com as regras (back/.../business/PedidoService.java)
                      └─ Repository JPA (back/.../infrastructure/repositories/)
                           └─ Tabela no SQL Server (database/ayvySQL_DER.sql)
```

- **URL da API no front:** `ayvy-react/src/services/api.js` (`VITE_API_BASE_URL`, padrão `http://localhost:8082`).
- **CORS (quem pode chamar a API):** `back/.../config/WebConfig.java` (libera `localhost:5173` e `5174`).
- **Erros da API → mensagem na tela:** o back responde `{ detail: "mensagem" }` (`exception/ApiExceptionHandler.java`) e o `api.js` transforma em `Error(message)`.
- **Imagens:** o front envia para `POST /upload` e o back salva em `back/uploads/…`, servido em `http://localhost:8082/uploads/...` (`UploadService` + `WebConfig`).

### Tabela "função do front → endpoint → classe do back"

| Front (`ayvy-react/src/services/`) | Endpoint | Back (controller → service) |
|---|---|---|
| `authApi.loginUsuario` | `POST /usuarios/login` | `UsuarioController` → `UsuarioService.autenticar` |
| `authApi.criarUsuario` / `criarCliente` / `criarLojista` | `POST /usuarios`, `/clientes`, `/lojistas` | `UsuarioService`, `ClienteService`, `LojistaService` |
| `senhaApi.solicitarCodigoSenha` | `POST /usuarios/recuperar-senha` | `RecuperacaoSenhaService.solicitarCodigo` (+ `SmsService`) |
| `senhaApi.redefinirSenhaComCodigo` | `POST /usuarios/redefinir-senha` | `RecuperacaoSenhaService.redefinirSenha` |
| `shopApi.listProdutosApi` / `loadShopsFromApi` | `GET /produtos`, `GET /lojistas` | `ProdutoService`, `LojistaService` |
| `categoriasApi.listCategoriasApi` | `GET /categorias` | `CategoriaService` |
| `lojistaApi.salvarProdutoLojista` / `atualizarProdutoLojista` | `POST/PUT /produtos`, `POST /produtos/{id}/imagens`, `POST /upload` | `ProdutoService`, `UploadService` |
| `lojistaApi.listPedidosDoLojista` | `GET /pedidos/all` + `GET /pedidos/{id}/itens` | `PedidoService` |
| `lojistaApi.confirmarRecebimentoLojista` | `PUT /pedidos/{id}/recebido` | `PedidoService.confirmarRecebimento` |
| `lojistaApi.separarPedidoLojista` | `PUT /pedidos/{id}/status?novoStatus=em_separacao` | `PedidoService.atualizarStatus` |
| `lojistaApi.despacharPedidoLojista` | `PUT /pedidos/{id}/envio` | `PedidoService.registrarEnvio` |
| `pedidosApi.checkoutPedido` | `POST /pedidos/checkout` | `PedidoService.finalizarCheckout` (+ `FreteService`) |
| `pedidosApi.calcularFrete` | `POST /frete/calcular` | `FreteService` (distância entre CEPs) |
| `pedidosApi.confirmarEntregaCliente` | `PUT /pedidos/{id}/entrega-confirmada` | `PedidoService.confirmarEntregaPeloCliente` |
| `pedidosApi.getPedidoHistorico` | `GET /pedidos/{id}/historico` | `PedidoService.listarHistoricoPorPedidoId` |
| `pedidosApi.criarPagamento` / `listPagamentos` | `POST/GET /pagamentos` | `PagamentoService` |
| `notificacoesApi.*` | `GET/PUT/DELETE /notificacoes` | `NotificacoesService` |
| `favoritosApi.*` | `/favoritos`, `POST /visualizacoes` | `FavoritosService`, `VisualizacoesProdutoService` |
| `adminApi.*` | CRUD de `/usuarios`, `/clientes`, `/lojistas`, `/produtos`, `/categorias` | controllers correspondentes |

---

## 3. "Eu quero achar…" (índice rápido)

| Quero… | Front | Back |
|---|---|---|
| Login / sessão do usuário | `pages/Login`, `context/AuthContext` (guarda em `localStorage: ayvy.auth`) | `UsuarioController /usuarios/login` |
| Cadastro de cliente/lojista | `pages/Cadastro`, `components/CadastroForm` | `UsuarioService`, `ClienteService`, `LojistaService` |
| Recuperar senha (código por e-mail/SMS) | `pages/EsqueciSenha`, `services/senhaApi.js` | `RecuperacaoSenhaService`, `SmsService`, tabela `redefinicao_senha` |
| Menu do topo (sanduíche) | `components/Navbar`, `components/NavbarMobile` | — |
| Rodapé padrão de todas as telas | `components/Footer`, `components/MainLayout` | — |
| Página de categorias (estilo SHEIN) | `pages/Categorias`, `utils/categoriaArvore.js` | `CategoriaArvoreBootstrap` (árvore), `CategoriaService` |
| Escolher categoria ao cadastrar produto | `pages/Loja/ProdutoNovo/CategoriaPicker.jsx` | `ProdutoService` (campo `categoria`) |
| Loja do lojista (produtos, rascunhos, pedidos) | `pages/Loja/index.jsx` | `ProdutoService`, `PedidoService` |
| Despachar pedido (local + código de rastreio) | `pages/Loja/DespacharModal.jsx` | `PUT /pedidos/{id}/envio` |
| Linha de envio com caminhão | `components/TrackingTimeline` | `Pedido.getEtapaEnvio()` (`infrastructure/entities/Pedido.java`) |
| Carrinho / importar carrinho do app | `context/CartContext` (`localStorage: ayvy.cart.v2`), `pages/Carrinho`, `utils/cartImport.js` | `GET /produtos` |
| Checkout (endereço, frete, pagamento) | `pages/Checkout` | `PedidoService.finalizarCheckout`, `FreteService` |
| Meus pedidos + confirmar entrega | `pages/MeusPedidos` | `PedidoService.confirmarEntregaPeloCliente` |
| Notificações (cliente, lojista, admin) | `pages/Notificacoes`, aviso no card da loja, "Atividade" no admin | `PedidoService` (`notificarCliente/Lojistas/Admins`) |
| Painel admin (pedidos, histórico, atividade) | `pages/Adim/*`, `components/AdminLayout` | `/pedidos/all`, `/pedidos/{id}/historico`, `/notificacoes` |
| Código do pedido por loja (`LU-1`) | `utils/pedidoNumero.js` | `SiglaLojaService`, `PedidoNumeroLojaBootstrap` |
| Escala da tela (Windows/Linux) | `src/index.css` (`--app-zoom`) | — |
| Tabelas e colunas do banco | — | `database/ayvySQL_DER.sql` e `back/.../infrastructure/entities/` |

---

## 4. Fluxos principais (do clique até o banco)

**Compra**
1. O cliente adiciona ao carrinho (`CartContext`).
2. Em `/checkout`, o front chama `POST /pedidos/checkout`.
3. O back valida o estoque, calcula o frete (`FreteService`) e grava `pedidos`, `pedido_produtos` (com `codigo_pedido_loja`, ex.: `LU-1`), `pedido_endereco_entrega` e `historico_compras`.
4. O front registra o pagamento (`POST /pagamentos`) e marca o pedido como `pago` (`PUT /pedidos/{id}/status`).
5. Cliente, lojista e admin recebem notificação.

**Envio**
1. O lojista confirma o recebimento (`/recebido`) e começa o preparo (`status=em_separacao`).
2. O lojista despacha (`/envio`, com local da postagem, transportadora e código de rastreio).
3. A etapa avança sozinha com o tempo: Coletado → Em rota → Entregue (`Pedido.getEtapaEnvio`).
4. O cliente clica em **Confirmar entrega** (`/entrega-confirmada`), e o lojista vê o aviso "Entrega confirmada pelo cliente".

**Recuperar senha**
1. Em `/esqueci-senha`, o cliente informa o e-mail e escolhe E-mail ou SMS.
2. O back gera um código de 6 dígitos, válido por 15 minutos, e guarda só o hash.
3. Se e-mail e SMS não estiverem configurados, o código aparece no **console do Spring**. Procure por `RECUPERAÇÃO DE SENHA`.
4. Para configurar o envio, veja as variáveis `SPRING_MAIL_*` e `TWILIO_*` em `back/src/main/resources/application.properties`.

**Carrinho do app → site**
1. O app abre `/carrinho?itens=10:2,15:1`.
2. O site busca os produtos em `GET /produtos`, respeita o estoque, avisa o que foi ajustado e limpa a URL (`utils/cartImport.js`).

---

## 5. Contas de teste (criadas pelos bootstraps)

- **Admin:** ver `back/.../config/AdminBootstrap.java`.
- **Lojistas e clientes de exemplo:** ver `back/.../config/DevSeedBootstrap.java`.
  - Lojistas: `lojaurbana@ayvy.com.br`, `sneakhouse@ayvy.com.br`, entre outros. A senha padrão está em `SENHA_PADRAO_LOJISTA`.
  - Clientes: `heloisa@ayvy.com.br`, `emilly@ayvy.com.br`, entre outros. A senha é o nome de usuário (ex.: `heloisaayvy`).

---

## 6. Git (atalhos que o grupo usa)

```bash
git switch corrigido                 # trocar de branch

# levar um commit de uma branch para outra
git switch main                      # volte para a main, se não estiver nela
git log --oneline                    # copie o código do último commit
git switch corrigido
git cherry-pick d23adc5              # cole aqui o código do commit
git push
```
