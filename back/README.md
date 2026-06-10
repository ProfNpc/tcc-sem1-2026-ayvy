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

O projeto usa **Microsoft SQL Server** (não Docker/MySQL).

1. SQL Server rodando em **`localhost:1433`**
2. Banco **`ayvy`** criado — script: **`database/ayvySQLEscola.sql`** (executar no SSMS)
3. Usuário/senha conferidos em **`src/main/resources/application.properties`**

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

Consome esta API via `ayvy-react/src/services/adminApi.js`

Detalhes: [README-GUIA §10 — ligação com o React](./README-GUIA.md#10-ligação-com-o-front-react) · [Guia do admin](../ayvy-react/src/pages/Adim/README-ADMIN.md)

---

## Deu erro?

Detalhes: [README-GUIA §12 — problemas comuns](./README-GUIA.md#12-problemas-comuns) · [Índice “eu quero encontrar…”](./README-GUIA.md#índice-eu-quero-encontrar)
