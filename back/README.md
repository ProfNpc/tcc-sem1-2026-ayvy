# AYVY API (Spring Boot)

API REST do projeto. Roda em **http://localhost:8082**

Guia fácil (pastas, URLs, SQL Server, onde achar tudo): **[README-GUIA.md](./README-GUIA.md)**

### Atalhos no guia completo

| Assunto | Link |
|---------|------|
| O que é o back | [README-GUIA §1](./README-GUIA.md#1-o-que-é-o-back-sem-enrolação) |
| O que ligar antes de testar | [README-GUIA §2](./README-GUIA.md#2-o-que-precisa-estar-ligado-antes-de-testar) |
| SQL Server (config + script) | [README-GUIA §3](./README-GUIA.md#3-banco-de-dados--sql-server-não-é-mais-dockermysql) |
| Subir a API | [README-GUIA §4](./README-GUIA.md#4-como-subir-a-api) |
| Pastas — “eu quero X, abro Y” | [README-GUIA §5](./README-GUIA.md#5-pastas-do-back--eu-quero-x-abro-y) |
| Todas as URLs da API | [README-GUIA §6](./README-GUIA.md#6-todos-os-caminhos-da-api-urls) |
| Tabelas no banco | [README-GUIA §7](./README-GUIA.md#7-tabelas-principais-no-sql-server) |
| Cadastro em 2 passos | [README-GUIA §8](./README-GUIA.md#8-regra-de-ouro-cadastro-em-2-passos) |
| Imagens (upload) | [README-GUIA §9](./README-GUIA.md#9-imagens-passo-a-passo) |
| Ligação com o React | [README-GUIA §10](./README-GUIA.md#10-ligação-com-o-front-react) |
| Postman | [README-GUIA §11](./README-GUIA.md#11-testar-sem-o-site-postman) |
| Problemas comuns | [README-GUIA §12](./README-GUIA.md#12-problemas-comuns) |
| Índice “eu quero encontrar…” | [README-GUIA — índice](./README-GUIA.md#índice-eu-quero-encontrar) |

---

## Antes de subir — SQL Server

O projeto usa **Microsoft SQL Server** (Docker na raiz ou instância local).

1. SQL Server rodando em **`localhost:1433`** (`docker compose up -d` na raiz)
2. Banco **`ayvy`** + tabelas — script: **`database/ayvySQL_DER.sql`** (DBeaver/SSMS)
3. Reset opcional: **`database/drop-ayvy-tables.sql`** e depois o DER de novo
4. Usuário/senha conferidos em **`src/main/resources/application.properties`**

Detalhes: [README-GUIA §3 — SQL Server](./README-GUIA.md#3-banco-de-dados--sql-server-não-é-mais-dockermysql)

---

## Subir a API

```bash
cd back
./mvnw spring-boot:run
```

Teste no navegador: http://localhost:8082/usuarios

Detalhes: [README-GUIA §4 — subir a API](./README-GUIA.md#4-como-subir-a-api) · [§2 — o que precisa estar ligado](./README-GUIA.md#2-o-que-precisa-estar-ligado-antes-de-testar)

---

## Cadastro (sempre 2 passos)

| Papel | 1 — `POST /usuarios` | 2 |
|-------|----------------------|---|
| admin | `papel: "admin"` | — |
| cliente | `papel: "cliente"` | `POST /clientes` |
| lojista | `papel: "lojista"` | `POST /lojistas` |

Detalhes: [README-GUIA §8 — cadastro em 2 passos](./README-GUIA.md#8-regra-de-ouro-cadastro-em-2-passos)

---

## URLs da API

Principais caminhos (base `http://localhost:8082`):

| Recurso | Caminho |
|---------|---------|
| Usuários | `/usuarios` |
| Clientes | `/clientes` |
| Lojistas | `/lojistas` |
| Produtos | `/produtos` |
| Categorias | `/categorias` |
| Upload | `/upload` |

Detalhes: [README-GUIA §6 — todas as URLs](./README-GUIA.md#6-todos-os-caminhos-da-api-urls) · [§5 — qual arquivo abrir no código](./README-GUIA.md#5-pastas-do-back--eu-quero-x-abro-y)

---

## Imagens

`POST /upload` → salva em `back/uploads/` → acessa em `http://localhost:8082/uploads/...`

Detalhes: [README-GUIA §9 — imagens passo a passo](./README-GUIA.md#9-imagens-passo-a-passo)

---

## Postman

`postman/AYVY-API.postman_collection.json` + `AYVY-Local.postman_environment.json`

Detalhes: [postman/README.md](./postman/README.md) · [README-GUIA §11 — Postman](./README-GUIA.md#11-testar-sem-o-site-postman)

---

## Front React

Consome esta API via `ayvy-react/src/services/*.js` (tabela completa "função do front → endpoint → service" no [README da raiz](../README.md#2-como-front-e-back-conversam-o-caminho-de-uma-chamada))

Detalhes: [README-GUIA §10 — ligação com o React](./README-GUIA.md#10-ligação-com-o-front-react) · [Guia do admin](../ayvy-react/src/pages/Adim/README-ADMIN.md)

---

## Mapa do código (camadas)

Pacote base: `src/main/java/com/ayvy/api_java/`

| Pasta | Para que serve | Exemplo |
|---|---|---|
| `controller/` | Recebe o HTTP: URL, parâmetros e corpo. Não tem regra de negócio | `PedidoController` → `/pedidos` |
| `business/` | **Regras de negócio** (validações, cálculos, notificações) | `PedidoService.finalizarCheckout` |
| `infrastructure/entities/` | Tabelas do banco como classes JPA | `Pedido` → tabela `pedidos` |
| `infrastructure/repositories/` | Consultas ao banco (Spring Data JPA) | `PedidoProdutosRepository.findByCodigoPedidoLoja` |
| `infrastructure/enums/` | Status e papéis | `StatusPedido`, `PapelUsuario` |
| `infrastructure/geo/` | CEP → coordenadas e distância (frete) | `CepGeoLocalizacaoClient`, `CalculadoraDistancia` |
| `dto/` | Formato do JSON de entrada de alguns endpoints | `CheckoutRequest`, `EnvioRequest`, `RecuperarSenhaRequest` |
| `config/` | Segurança, CORS, `/uploads` e dados iniciais (bootstraps) | `WebConfig`, `SecurityFilterChainConfig` |
| `exception/` | Erros viram `{ "detail": "mensagem" }` para o front | `ApiExceptionHandler` |

### Bootstraps (rodam sozinhos ao subir, em ordem)

| Ordem | Classe | O que faz |
|---|---|---|
| 2 | `DevSeedBootstrap` | lojas, produtos e clientes de exemplo (só cria o que falta) |
| 3 | `PedidoNumeroLojaBootstrap` | preenche sigla da loja e código `LU-1` de pedidos antigos |
| 4 | `CategoriaArvoreBootstrap` | árvore de categorias, junta repetidas e move produtos do seed |
| sem `@Order` (por último) | `AdminBootstrap` | garante a conta admin |

## Endpoints de pedidos, envio e senha (fluxo completo)

| Método e caminho | Quem usa no site | Service |
|---|---|---|
| `POST /pedidos/checkout` | Checkout (cliente) | `PedidoService.finalizarCheckout` |
| `GET /pedidos?usuarioId=` · `GET /pedidos/all` | Meus pedidos · Loja/Admin | `PedidoService` |
| `GET /pedidos/{id}/itens` · `/endereco-entrega` · `/historico` | telas de pedido · admin | `PedidoService` |
| `GET /pedidos/codigo/{codigo}` | busca por `LU-1` | `PedidoService.buscarPedidoPorCodigo` |
| `PUT /pedidos/{id}/status?novoStatus=` | pago (checkout), preparo/cancelar (lojista), admin | `PedidoService.atualizarStatus` |
| `PUT /pedidos/{id}/recebido` | lojista "Confirmar pedido recebido" | `PedidoService.confirmarRecebimento` |
| `PUT /pedidos/{id}/envio` | lojista "Marcar como despachado" (local, transportadora, rastreio) | `PedidoService.registrarEnvio` |
| `PUT /pedidos/{id}/entrega-confirmada?usuarioId=` | cliente "Confirmar entrega" | `PedidoService.confirmarEntregaPeloCliente` |
| `POST /frete/calcular` | carrinho/checkout | `FreteService` |
| `POST /usuarios/recuperar-senha` | Esqueci a senha (e-mail ou SMS) | `RecuperacaoSenhaService` (+ `SmsService`) |
| `POST /usuarios/redefinir-senha` | Esqueci a senha (código + nova senha) | `RecuperacaoSenhaService` |

A etapa da linha de envio (`etapaEnvio`, `segundosDesdeEnvio`) é calculada em `Pedido.java`: 2 min andando e 3 min parado em cada etapa.

## E-mail e SMS (recuperação de senha)

Sem configuração, o código aparece no **console do Spring** (procure `RECUPERAÇÃO DE SENHA`).
Para enviar de verdade, defina antes do `./mvnw spring-boot:run`:

- **E-mail (Gmail):** `SPRING_MAIL_HOST=smtp.gmail.com`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (senha de app).
- **SMS (Twilio):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.

---

## Deu erro?

Detalhes: [README-GUIA §12 — problemas comuns](./README-GUIA.md#12-problemas-comuns) · [Índice “eu quero encontrar…”](./README-GUIA.md#índice-eu-quero-encontrar)


