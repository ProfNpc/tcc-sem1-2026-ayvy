# Postman — AYVY API

## Importar

1. Postman → **Import**
2. Arquivos:
   - `AYVY-API.postman_collection.json`
   - `AYVY-Local.postman_environment.json`
3. Ative o ambiente **AYVY — Local**
4. Suba **SQL Server** + API:

```bash
cd back && ./mvnw spring-boot:run
```

## Variáveis

| Variável | Uso |
|----------|-----|
| `baseUrl` | http://localhost:8082 |
| `usuarioId`, `clienteId`, `lojistaId`, … | IDs nos paths e bodies — ajuste após criar registros |

## Banco (SQL Server)

| Campo | Valor |
|-------|--------|
| Servidor | localhost:1433 |
| Database | ayvy |
| User / Password | ver `back/src/main/resources/application.properties` |

Script das tabelas: `database/ayvySQLEscola.sql` (SSMS)

## Imagens

1. **POST /upload** — Body `form-data`: `file` + `pasta` (`produtos`, `lojistas`, `usuarios`)
2. Copie `caminho` da resposta para o JSON do produto/loja/usuário
3. Abra `url` no navegador para ver a imagem

## Fluxo de cadastro

1. **POST /usuarios** — `nome`, `email`, `senha`, `papel` (`admin` | `cliente` | `lojista`). Status opcional (default `ativo`).
2. Copie o `id` retornado para a variável `usuarioId`.
3. **POST /clientes** ou **POST /lojistas** — `usuarioId` + dados do perfil.

## JSON — convenções

- Enums em **minúsculo**
- Lojista: `{ "usuarioId": 2, "nomeLoja": "...", "slug": "...", "cnpj": "..." }`
- Cliente: `{ "usuarioId": 2, "cpf": "..." }`

Guia completo do back: [../README-GUIA.md](../README-GUIA.md)
