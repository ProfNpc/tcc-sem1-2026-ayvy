# Back AYVY — Guia fácil (Spring Boot + SQL Server)

> **Para quem está perdido:** leia na ordem **1 → 2 → 3**.  
> **Para achar algo rápido:** use o **[Índice “eu quero…”](#índice-eu-quero-encontrar-algo)** no final.

---

## 1. O que é o back? (sem enrolação)

Imagine 3 coisas:

| Peça | O que faz | Onde fica |
|------|-----------|-----------|
| **Banco SQL Server** | Guarda usuários, lojas, produtos… | Servidor `localhost:1433`, banco **`ayvy`** |
| **API (este projeto)** | Recebe pedidos do site, lê/grava no banco | `http://localhost:8082` |
| **Front React** | Telas bonitas que você clica | `http://localhost:5173` |

O back **não tem tela**. Ele só responde coisas tipo:

- “Me dá a lista de usuários” → `GET http://localhost:8082/usuarios`
- “Cadastra esse produto” → `POST http://localhost:8082/produtos`

O site React chama isso automaticamente (arquivo `ayvy-react/src/services/adminApi.js`).

---

## 2. O que precisa estar ligado antes de testar

```
[ SQL Server ]  ←  banco ayvy rodando
       ↑
[ Spring Boot ]  ←  cd back && ./mvnw spring-boot:run  (porta 8082)
       ↑
[ React/Vite ]   ←  cd ayvy-react && npm run dev  (porta 5173)
```

**Teste rápido:** abra no navegador → http://localhost:8082/usuarios  
Se aparecer JSON (ou `[]`), a API está viva.

---

## 3. Banco de dados — SQL Server (não é mais Docker/MySQL)

### Onde está a configuração

Arquivo: **`back/src/main/resources/application.properties`**

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=ayvy;...
spring.datasource.username=sa
spring.datasource.password=...
server.port=8082
```

| Item | Valor atual do projeto |
|------|------------------------|
| Tipo | **Microsoft SQL Server** |
| Servidor | `localhost` |
| Porta | **1433** |
| Nome do banco | **`ayvy`** |
| Usuário | `sa` (conferir no `application.properties`) |
| Senha | conferir no `application.properties` |

> As linhas de **MySQL/Docker** no mesmo arquivo estão **comentadas** (`#`) — não são usadas.

### Script para criar as tabelas

Arquivo: **`database/ayvySQLEscola.sql`** (versão SQL Server, para SSMS)

Como usar (SQL Server Management Studio ou similar):

1. Abra o SSMS e conecte em `localhost`
2. Abra o arquivo `database/ayvySQLEscola.sql`
3. Execute o script (cria o banco `ayvy` e todas as tabelas)

O arquivo `database/ayvy_schema.sql` é a versão **MySQL antiga** — só serve de referência histórica.

### Hibernate (`ddl-auto=update`)

Com `spring.jpa.hibernate.ddl-auto=update`, o Spring pode **ajustar colunas** sozinho ao subir.  
Mesmo assim, o ideal é ter o script SQL Server aplicado antes.

---

## 4. Como subir a API

```bash
cd back
./mvnw spring-boot:run
```

Aguarde aparecer algo como “Started ApiJavaApplication”.  
URL base: **http://localhost:8082**

---

## 5. Pastas do back — “eu quero X, abro Y”

```
back/
│
├── README.md              → subir rápido (resumo)
├── README-GUIA.md         → ESTE guia (explicação fácil)
│
├── src/main/java/com/ayvy/api_java/
│   │
│   ├── controller/        → 🌐 CAMINHOS DA API (/usuarios, /produtos…)
│   │   ├── UsuarioController.java
│   │   ├── ClienteController.java
│   │   ├── LojistaController.java
│   │   ├── ProdutoController.java
│   │   ├── CategoriaController.java
│   │   ├── UploadController.java
│   │   ├── PedidoController.java
│   │   └── ...
│   │
│   ├── business/          → 🧠 REGRAS (validação, cadastro em 2 passos)
│   │   ├── UsuarioService.java
│   │   ├── ClienteService.java
│   │   ├── LojistaService.java
│   │   └── ProdutoService.java
│   │
│   ├── infrastructure/
│   │   ├── entities/      → 📋 TABELAS do banco (Usuario, Produto…)
│   │   ├── repositories/  → 💾 Salvar/buscar no SQL Server
│   │   └── enums/         → 🏷️ Status e papéis (ativo, lojista…)
│   │
│   ├── config/WebConfig.java      → CORS + servir imagens /uploads
│   └── exception/ApiExceptionHandler.java → mensagens de erro JSON
│
├── src/main/resources/
│   └── application.properties     → ⚙️ SQL Server, porta 8082
│
├── uploads/               → 📷 fotos salvas (produtos, lojas, avatars)
├── postman/               → 🧪 testar API sem o site
└── mvnw                   → rodar o projeto
```

### Analogia simples (decorar isso)

| Camada | Pergunta que responde | Exemplo |
|--------|----------------------|---------|
| **Controller** | Qual **URL** e qual **botão HTTP**? | `POST /usuarios` |
| **Service** | **Pode** fazer isso? Qual a regra? | “Usuário novo = ativo” |
| **Entity** | Como é a **linha no banco**? | tabela `usuarios` |
| **Repository** | **Grava/lê** no SQL Server | `save()`, `findAll()` |

### Fluxo quando alguém cadastra usuário

```
Front clica Salvar
    → POST http://localhost:8082/usuarios
        → UsuarioController.java
        → UsuarioService.java  (valida, põe status ativo)
        → UsuarioRepository.java
        → SQL Server (tabela usuarios)
```

---

## 6. Todos os caminhos da API (URLs)

Sempre começa com: **`http://localhost:8082`**

### Admin / painel (o React usa hoje)

#### Usuários — arquivo: `controller/UsuarioController.java`

| O que você quer | Método | Caminho completo |
|-----------------|--------|------------------|
| Listar todos | GET | `/usuarios` |
| Ver um | GET | `/usuarios/5` |
| Criar | POST | `/usuarios` |
| Editar | PUT | `/usuarios/5` |
| Excluir | DELETE | `/usuarios/5` |
| Filtrar por status | GET | `/usuarios/status/ativo` |
| Desativar | PUT | `/usuarios/5/desativar` |

#### Clientes — `controller/ClienteController.java`

| Ação | Método | Caminho |
|------|--------|---------|
| Listar | GET | `/clientes` |
| Ver um | GET | `/clientes/{id}` |
| Criar perfil | POST | `/clientes` |
| Editar | PUT | `/clientes/{id}` |
| Excluir | DELETE | `/clientes/{id}` |

#### Lojistas — `controller/LojistaController.java`

| Ação | Método | Caminho |
|------|--------|---------|
| Listar | GET | `/lojistas` |
| Ver um | GET | `/lojistas/{id}` |
| Criar loja | POST | `/lojistas` |
| Editar | PUT | `/lojistas/{id}` |
| Excluir | DELETE | `/lojistas/{id}` |

#### Produtos — `controller/ProdutoController.java`

| Ação | Método | Caminho |
|------|--------|---------|
| Listar | GET | `/produtos` |
| Ver um | GET | `/produtos/{id}` |
| Criar | POST | `/produtos` |
| Editar | PUT | `/produtos/{id}` |
| Excluir | DELETE | `/produtos/{id}` |
| Listar fotos extra | GET | `/produtos/{id}/imagens` |
| Adicionar foto | POST | `/produtos/{id}/imagens` |
| Apagar foto | DELETE | `/produtos/{id}/imagens/{imagemId}` |

#### Categorias — `controller/CategoriaController.java`

| Ação | Método | Caminho |
|------|--------|---------|
| Listar | GET | `/categorias` |
| Ver por nome | GET | `/categorias/{nome}` |
| Criar | POST | `/categorias` |
| Editar | PUT | `/categorias/{id}` |
| Excluir | DELETE | `/categorias/{id}` |

#### Upload de imagem — `controller/UploadController.java`

| Ação | Método | Caminho |
|------|--------|---------|
| Enviar arquivo | POST | `/upload` |

Corpo: `multipart` com `file` + `pasta` (`produtos`, `lojistas`, `usuarios`).

#### Ver imagem no navegador

Não é Controller de cadastro — arquivo estático:

`GET http://localhost:8082/uploads/produtos/nome-do-arquivo.jpg`

Arquivo físico: **`back/uploads/produtos/`**

### Outros (API pronta, vitrine/pedidos)

| Recurso | Arquivo | Caminho base |
|---------|---------|--------------|
| Pedidos | `PedidoController.java` | `/pedidos` |
| Pagamentos | `PagamentoController.java` | `/pagamentos` |
| Endereços | `EnderecoController.java` | `/enderecos` |
| Mensagens | `MensagemController.java` | `/mensagens` |

**Dica:** abra qualquer `*Controller.java` → a linha `@RequestMapping("/alguma-coisa")` é o **prefixo** de todas as rotas daquele arquivo.

---

## 7. Tabelas principais no SQL Server

### Tabela `usuarios` — quem pode logar

| Coluna importante | Significado |
|-------------------|-------------|
| `papel` | `admin`, `cliente` ou `lojista` |
| `status` | `ativo`, `inativo`, `bloqueado` |
| `email`, `senha_hash` | login |

Arquivo Java: `entities/Usuario.java`  
Valores permitidos: `enums/StatusUsuario.java`, `enums/PapelUsuario.java`

### Tabela `clientes` — perfil de comprador

Liga em `usuario_id`. Tem **CPF**, data nascimento.  
**Não repete** e-mail/senha (isso está em `usuarios`).

Arquivo: `entities/Cliente.java`

### Tabela `lojistas` — perfil de loja

Liga em `usuario_id`. Tem nome da loja, slug, CNPJ, banner, logo.  
Tem também `status_loja` (pendente, aprovado…) — **diferente** do status do usuário.

Arquivo: `entities/Lojista.java` · enum: `enums/StatusLoja.java`

### Tabela `produtos`

Status: `rascunho`, `ativo`, `inativo`, `esgotado`  
Arquivo: `entities/Produto.java` · enum: `enums/StatusProduto.java`

---

## 8. Regra de ouro: cadastro em 2 passos

**Nunca** cadastra cliente/lojista com senha direto na tabela de perfil.

```
PASSO 1 — Cria a PESSOA (login)
POST /usuarios
{
  "nome": "Maria",
  "email": "maria@email.com",
  "senha": "123456",
  "papel": "cliente"
}

PASSO 2 — Cria o PERFIL (usa o id que voltou)
POST /clientes
{
  "usuarioId": 2,
  "cpf": "12345678901"
}
```

| Tipo | Passo 1 | Passo 2 |
|------|---------|---------|
| Admin | POST `/usuarios` (`papel: admin`) | — |
| Cliente | POST `/usuarios` (`papel: cliente`) | POST `/clientes` |
| Lojista | POST `/usuarios` (`papel: lojista`) | POST `/lojistas` |

Onde está a regra no código:

- `business/UsuarioService.java`
- `business/ClienteService.java`
- `business/LojistaService.java`

Usuário novo → **sempre `ativo`** se você não mandar status.

---

## 9. Imagens (passo a passo)

1. Front envia arquivo → **POST `/upload`** (pasta `produtos`, `lojistas` ou `usuarios`)
2. API devolve `"caminho": "/uploads/produtos/abc.jpg"`
3. Front manda esse caminho no JSON ao **POST/PUT** produto/loja/usuário
4. API grava o caminho no SQL Server
5. Navegador mostra: `http://localhost:8082/uploads/produtos/abc.jpg`

Pasta no disco: **`back/uploads/`**  
Quem configura isso: **`config/WebConfig.java`**

---

## 10. Ligação com o front React

| No back | No front |
|---------|----------|
| `UsuarioController` `/usuarios` | `adminApi.js` → `listUsuarios()`, `createUsuario()`… |
| `ProdutoController` `/produtos` | `listProdutos()`, `updateProduto()`… |
| Porta 8082 | `ayvy-react/src/services/api.js` → `API_BASE_URL` |

Guia do painel admin (botões Salvar, Excluir…):  
**`ayvy-react/src/pages/Adim/README-ADMIN.md`**

---

## 11. Testar sem o site (Postman)

1. Abra o Postman
2. Importe:
   - `back/postman/AYVY-API.postman_collection.json`
   - `back/postman/AYVY-Local.postman_environment.json`
3. Ative o ambiente **AYVY — Local**
4. Confira `baseUrl` = `http://localhost:8082`

Mais detalhes: **`back/postman/README.md`**

---

## 12. Problemas comuns

| Sintoma | Provável causa | O que fazer |
|---------|----------------|-------------|
| Front: “não conectou em 8082” | API parada | `cd back && ./mvnw spring-boot:run` |
| Erro ao subir API (banco) | SQL Server off ou senha errada | SSMS + conferir `application.properties` |
| Tabela não existe | Script não rodou | Executar `database/ayvySQLEscola.sql` |
| Imagem não aparece | Caminho errado ou arquivo sumiu | Ver `back/uploads/` e URL `/uploads/...` |
| CORS | Front em porta não liberada | `WebConfig.java` (5173, 5174) |

---

## Índice “eu quero encontrar…”

| Eu quero… | Vá em… |
|-----------|--------|
| **Subir a API** | `README.md` → `./mvnw spring-boot:run` |
| **Config do SQL Server** | `src/main/resources/application.properties` |
| **Criar banco/tabelas** | `database/ayvySQLEscola.sql` (SSMS) |
| **Ver todas as URLs** | pasta `controller/` ou seção 6 deste guia |
| **Regra de cadastro** | `business/UsuarioService.java` (e Cliente/Lojista) |
| **Como é a tabela X** | `infrastructure/entities/` |
| **Status ativo/inativo…** | `infrastructure/enums/` |
| **Onde ficam as fotos** | `back/uploads/` |
| **Testar no Postman** | `back/postman/` |
| **O que o site chama** | `ayvy-react/src/services/adminApi.js` |
| **Guia do admin (front)** | `ayvy-react/src/pages/Adim/README-ADMIN.md` |
| **Mensagem de erro JSON** | `exception/ApiExceptionHandler.java` |
| **Liberar o React (CORS)** | `config/WebConfig.java` |

---

## Resumo de 30 segundos

1. **Banco** = SQL Server, banco **`ayvy`**, config em **`application.properties`**
2. **API** = Java na porta **8082**, rotas em **`controller/`**
3. **Regras** = **`business/`**
4. **Tabelas** = **`entities/`** + script **`ayvySQLEscola.sql`**
5. **Site** = React chama **`adminApi.js`**, que bate na API
6. **Fotos** = **`POST /upload`** → pasta **`uploads/`**

O back só entrega **JSON + imagens**. Quem monta a tela é o React.
