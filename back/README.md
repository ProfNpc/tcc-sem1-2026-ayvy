# AYVY API (Spring Boot)

API REST do projeto. Roda em **http://localhost:8082**

Guia fácil (pastas, URLs, SQL Server, onde achar tudo): **[README-GUIA.md](./README-GUIA.md)**

---

## Antes de subir — SQL Server

O projeto usa **Microsoft SQL Server** (não Docker/MySQL).

1. SQL Server rodando em **`localhost:1433`**
2. Banco **`ayvy`** criado — script: **`database/ayvySQLEscola.sql`** (executar no SSMS)
3. Usuário/senha conferidos em **`src/main/resources/application.properties`**

---

## Subir a API

```bash
cd back
./mvnw spring-boot:run
```

Teste no navegador: http://localhost:8082/usuarios

---

## Cadastro (sempre 2 passos)

| Papel | 1 — `POST /usuarios` | 2 |
|-------|----------------------|---|
| admin | `papel: "admin"` | — |
| cliente | `papel: "cliente"` | `POST /clientes` |
| lojista | `papel: "lojista"` | `POST /lojistas` |

Detalhes: [README-GUIA.md](./README-GUIA.md#8-regra-de-ouro-cadastro-em-2-passos)

---

## Imagens

`POST /upload` → salva em `back/uploads/` → acessa em `http://localhost:8082/uploads/...`

---

## Postman

`postman/AYVY-API.postman_collection.json` + `AYVY-Local.postman_environment.json`  
Ver [postman/README.md](./postman/README.md)

---

## Front React

Consome esta API via `ayvy-react/src/services/adminApi.js`  
Guia do admin: `ayvy-react/src/pages/Adim/README-ADMIN.md`
