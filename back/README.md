# AYVY API (Spring Boot)

## Banco de dados (MySQL)

A API usa o MySQL do `docker-compose.yml` na raiz do repositório.

### 1. Subir o MySQL

```bash
# na raiz do repo
docker compose up -d
```

Na **primeira** execução, o schema `database/ayvy_schema.sql` é aplicado automaticamente.

Se o container já existia sem o schema, recrie o volume:

```bash
docker compose down -v
docker compose up -d
```

Ou aplique manualmente:

```bash
docker exec -i ayvy_mysql mysql -uroot -proot < database/ayvy_schema.sql
```

### 2. Subir a API

```bash
cd back
./mvnw spring-boot:run

### para trocar de branch git switch corrigido

!!!!!!!!!!!!!!!! e para puxar o commit de uma para outra !!!!!!!!!!!!!!!! 
git switch main <caso não esteja no main, voltar para ele> 
git log --oneline <para ver o endereço do ultimo commit> 
git switch corrigido
git cherry-pick d23adc5 <coloca aqui o endereço do ultimo commit> 
git push

Base: http://localhost:8082

### Cadastro (fluxo em 2 passos)

| Papel | Passo 1 — `POST /usuarios` | Passo 2 |
|-------|---------------------------|---------|
| **admin** | `papel: "admin"` | — (sem perfil extra) |
| **cliente** | `papel: "cliente"` | `POST /clientes` com `usuarioId` + `cpf` |
| **lojista** | `papel: "lojista"` | `POST /lojistas` com `usuarioId` + dados da loja |

Todo usuário novo entra com **`status: ativo`** se não enviar status. A senha não é retornada nas respostas GET.

### Imagens (`back/uploads/`)

1. `POST /upload` — `multipart/form-data`: campo `file` + `pasta` (`produtos` | `lojistas` | `usuarios` | `geral`)
2. Resposta: `{ "caminho": "/uploads/produtos/uuid.jpg", "url": "http://localhost:8082/uploads/..." }`
3. Grave **`caminho`** no banco (`imagemPrincipalUrl`, `bannerUrl`, `logoUrl`, `avatarUrl` ou `POST /produtos/{id}/imagens`)

Arquivos ficam em `back/uploads/`. A API serve em `GET http://localhost:8082/uploads/...`.

### Configuração

| Arquivo | Conteúdo |
|---------|----------|
| `src/main/resources/application.properties` | MySQL `localhost:3306/ayvy`, user `root`, senha `root` |
| `src/main/resources/application-h2.properties` | Perfil H2 em memória (sem Docker): `-Dspring-boot.run.profiles=h2` |

JPA: `ddl-auto=validate` — o schema é mantido pelo SQL, não pelo Hibernate.

## Postman

Importe `back/postman/AYVY-API.postman_collection.json` e o ambiente `AYVY-Local.postman_environment.json`.
