# Postman — AYVY API

## Importar

1. Postman → **Import**
2. Arquivos:
   - `AYVY-API.postman_collection.json`
   - `AYVY-Local.postman_environment.json`
3. Ative o ambiente **AYVY — Local (MySQL)**
4. Suba MySQL e API:

```bash
docker compose up -d          # raiz do repo
cd back && ./mvnw spring-boot:run
```

## Variáveis

| Variável | Uso |
|----------|-----|
| `baseUrl` | http://localhost:8082 |
| `usuarioId`, `clienteId`, `lojistaId`, … | IDs nos paths e bodies — ajuste após criar registros |

A collection também define as mesmas variáveis; o ambiente sobrescreve ao estar ativo.

## Banco (MySQL)

| Campo | Valor |
|-------|--------|
| Host | localhost:3306 |
| Database | ayvy |
| User / Password | root / root |

Config: `back/src/main/resources/application.properties`

## Imagens

1. **POST /upload** — Body `form-data`: `file` (arquivo) + `pasta` (`produtos`, `lojistas`, `usuarios`)
2. Copie `caminho` da resposta para o JSON do produto/loja/usuário
3. Abra `url` no navegador para ver a imagem

## Fluxo de cadastro

1. **POST /usuarios** — `nome`, `email`, `senha`, `papel` (`admin` | `cliente` | `lojista`). Status opcional (default `ativo`).
2. Copie o `id` retornado para a variável `usuarioId`.
3. **POST /clientes** ou **POST /lojistas** — apenas `usuarioId` + dados do perfil (sem objeto `usuario` aninhado).

## JSON — convenções

- Enums em **minúsculo**
- Lojista: `{ "usuarioId": 2, "nomeLoja": "...", "slug": "...", "cnpj": "..." }`
- Cliente: `{ "usuarioId": 2, "cpf": "..." }`
- Pedido / pagamento / produto / endereço: ver pastas na collection

**Seed:** admin `usuarioId=1`, categorias ids 1–4.
