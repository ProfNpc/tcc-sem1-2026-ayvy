# Painel Admin — Guia completo (AYVY)

Este documento explica como o painel admin funciona, **onde cada API é chamada** e como navegar no código com os comentários que foram adicionados nos arquivos.

---

## Passo a passo: como achar onde a API é chamada

Siga esta ordem quando quiser entender **qual botão ou tela chama qual endpoint**.

### Passo 1 — Mapa geral de todas as APIs

Abra:

`ayvy-react/src/services/adminApi.js`

Cada função tem um comentário **em cima da linha** `return apiJson(...)` ou `return apiFetch(...)` com o caminho HTTP:

| Função no código      | Método | Caminho (exemplo)        |
|-----------------------|--------|--------------------------|     GET= Ler
| `listUsuarios()`      | GET    | `/usuarios`              |     POST= Criar
| `getUsuario(id)`      | GET    | `/usuarios/:id`          |     PUT= Atualizar
| `createUsuario(...)`  | POST   | `/usuarios`              |     DELETE= Deletar
| `updateUsuario(...)`  | PUT    | `/usuarios/:id`          |
| `deleteUsuario(id)`   | DELETE | `/usuarios/:id`          |
| `listClientes()`      | GET    | `/clientes`              |
| `createCliente(...)`  | POST   | `/clientes`              |
| `listLojistas()`      | GET    | `/lojistas`              |
| `createLojista(...)`  | POST   | `/lojistas`              |
| `listProdutos()`      | GET    | `/produtos`              |
| `createProduto(...)`  | POST   | `/produtos`              |
| `uploadImage(...)`    | POST   | `/upload`                |

> **Dica:** se você sabe o nome da função (`createLojista`, `updateUsuario`, etc.), comece sempre por aqui.

---

### Passo 2 — Resumo no topo de cada formulário

Abra o `Form.jsx` da tela que você está estudando (ex.: `Lojistas/Form.jsx`).

No **início do arquivo** há um bloco que lista:

- Rotas do React (`/admin/lojistas/novo`, `/admin/lojistas/:id/editar`)
- Quais APIs aquele form usa (GET ao abrir, POST ao criar, PUT ao editar)
- O que fica na **lista** (`index.jsx`), como Excluir e Editar

---

### Passo 3 — Comentários em cima de cada comando

Dentro dos arquivos, **logo acima** de cada `await` ou ação importante, há comentários no formato:

```javascript
// GET /usuarios/:id — traz dados para o formulário de edição
const data = await getUsuario(id);

// POST /lojistas — cria loja nova
await createLojista({ ... });

// PUT /usuarios/:id — salva status ativo / inativo / bloqueado
await updateUsuario(Number(form.usuarioId), { status: form.usuarioStatus });
```

Procure por: `// GET`, `// POST`, `// PUT`, `// DELETE` na pasta `Adim/`.

---

### Passo 4 — Botões na tela: onde clicar e qual API roda

Pense em **três lugares** na interface. Cada um tem botões diferentes.

#### A) Na **lista** (`index.jsx` — tabela com ID, nome, ações)

| Você clica em… | Chama API na hora? | O que acontece depois |
|----------------|-------------------|------------------------|
| **+ Novo …** (canto superior) | Não | Só abre a página de cadastro (`Form.jsx`). A API **POST** só roda quando você clicar **Salvar** no form. |
| **Editar** (na linha) | Não | Só abre o form de edição. Ao abrir: **GET** `/:id`. Ao **Salvar**: **PUT** `/:id`. |
| **Excluir** (vermelho, na linha) | **Sim** | `handleDelete` → **DELETE** `/:id` → lista recarrega (**GET** de novo). |
| **Atualizar** (acima da tabela) | **Sim** | `load()` → **GET** da lista inteira. |
| **Buscar ▼** (filtro por status) | Não | Filtra só no navegador; não chama API. |

**Onde ler no código:** comentários no `<Link>`, no `onClick` do Excluir e na função `load()`.

---

#### B) No **formulário** (`Form.jsx` — criar ou editar)

| Você clica em… | Chama API na hora? | Endpoint (exemplo usuário) |
|----------------|-------------------|----------------------------|
| **Salvar** | **Sim** | Cadastro novo → **POST** `/usuarios` · Edição → **PUT** `/usuarios/:id` |
| **Cancelar** | Não | Volta para a lista; não salva nada. |

Fluxo do **Salvar**:

1. Botão `type="submit"` dispara `onSubmit` do `<form>`
2. Entra em `handleSubmit`
3. `await create...` (novo) ou `await update...` (editar) — comentário `// POST` ou `// PUT` em cima da linha

**Onde ler no código:** comentário em cima do `<button type="submit">` e em cima do `await` dentro de `handleSubmit`.

---

#### C) No **modal** e no **upload** (só em algumas telas)

| Você clica em… | Arquivo | API |
|----------------|---------|-----|
| **+ Novo usuário** (dentro do form de Cliente/Lojista) | Abre `UsuarioQuickModal.jsx` | — |
| **Criar e selecionar** (no modal) | `UsuarioQuickModal.jsx` → `handleSubmit` | **POST** `/usuarios` |
| Escolher arquivo de imagem (avatar, logo, produto…) | `ImageUploadField.jsx` | **POST** `/upload` |

O upload **não** grava o produto/loja ainda — só envia o arquivo. O caminho da imagem vai no body quando você clicar **Salvar** no form.

---

#### Botões que **não** são API de cadastro

- **Cancelar** (lista ou form) — só navegação React Router  
- **Ver loja** / **Ver produto** — abre a vitrine pública no navegador  

---

### Passo 5 — A “estrada” comum: `api.js`

Abra:

`ayvy-react/src/services/api.js`

Este arquivo **não** sabe de usuário ou produto. Ele só:

1. Monta a URL completa (`http://localhost:8082` + `/usuarios`)
2. Faz o `fetch`
3. Trata erro de conexão (back desligado)
4. Converte a resposta JSON

Fluxo completo:

```
Tela React  →  adminApi.js  →  apiJson / apiFetch  →  api.js (fetch)  →  Back Spring Boot
```

A URL base vem de `VITE_API_BASE_URL` no `.env` ou, se não existir, `http://localhost:8082`.

---

## Exemplos práticos por entidade

### Usuário

| Ação              | Onde olhar              | API |
|-------------------|-------------------------|-----|
| Listar na tabela  | `Usuarios/index.jsx` → `load()` | GET `/usuarios` |
| Criar             | `Usuarios/Form.jsx` → Salvar | POST `/usuarios` |
| Editar            | Link Editar → `Form.jsx` → Salvar | GET `/usuarios/:id` + PUT `/usuarios/:id` |
| Excluir           | `Usuarios/index.jsx` → Excluir | DELETE `/usuarios/:id` |

### Cliente

| Ação              | Onde olhar              | API |
|-------------------|-------------------------|-----|
| Listar            | `Clientes/index.jsx`    | GET `/clientes` |
| Criar perfil      | `Clientes/Form.jsx` → Salvar | POST `/clientes` |
| Editar perfil     | `Clientes/Form.jsx`     | GET `/clientes/:id` + PUT `/clientes/:id` |
| Novo usuário (modal) | `UsuarioQuickModal`  | POST `/usuarios` |
| Excluir           | `Clientes/index.jsx`    | DELETE `/clientes/:id` |

### Lojista

| Ação              | Onde olhar              | API |
|-------------------|-------------------------|-----|
| Listar            | `Lojistas/index.jsx`    | GET `/lojistas` |
| Criar loja        | `Lojistas/Form.jsx` → Salvar | POST `/lojistas` |
| Editar loja       | `Lojistas/Form.jsx`     | PUT `/lojistas/:id` |
| Editar status do responsável | `Lojistas/Form.jsx` (edição) | PUT `/usuarios/:id` |
| Excluir           | `Lojistas/index.jsx`    | DELETE `/lojistas/:id` |

### Produto

| Ação              | Onde olhar              | API |
|-------------------|-------------------------|-----|
| Listar            | `Produtos/index.jsx`    | GET `/produtos` |
| Criar             | `Produtos/Form.jsx` → Salvar | POST `/produtos` |
| Editar            | `Produtos/Form.jsx`     | GET `/produtos/:id` + PUT `/produtos/:id` |
| Galeria de fotos  | `Produtos/Form.jsx` após Salvar | POST `/produtos/:id/imagens` |
| Excluir           | `Produtos/index.jsx`    | DELETE `/produtos/:id` |

---

## Atalhos de busca no editor (Cursor / VS Code)

Para achar **todas** as chamadas de API no admin:

1. Buscar comentários de rota: `// GET` ou `// POST` ou `// PUT` ou `// DELETE` em `src/pages/Adim/`
2. Buscar chamadas: `await create`, `await update`, `await delete`, `await get`, `await list`
3. Buscar funções do serviço: `from "../../../services/adminApi"` nos arquivos da pasta `Adim/`

---

## Rotas do React (front)

| Tela        | Lista              | Novo                    | Editar                          |
|------------|--------------------|-------------------------|---------------------------------|
| Usuários   | `/admin/usuarios`  | `/admin/usuarios/novo`  | `/admin/usuarios/:id/editar`    |
| Clientes   | `/admin/clientes`  | `/admin/clientes/novo`  | `/admin/clientes/:id/editar`    |
| Lojistas   | `/admin/lojistas`  | `/admin/lojistas/novo`  | `/admin/lojistas/:id/editar`    |
| Produtos   | `/admin/produtos`  | `/admin/produtos/novo`  | `/admin/produtos/:id/editar`    |

---

## Filtro "Buscar" (coluna na tabela)

Nas listas, a coluna **Buscar ▼** abre um menu pequeno (só ao clicar) para filtrar por status **no navegador** — **não chama API**.

| Tela      | Opções do menu                         | Campo filtrado                          |
|-----------|----------------------------------------|-----------------------------------------|
| Usuários  | Todos, ativo, inativo, bloqueado        | `row.status`                            |
| Clientes  | Todos, ativo, inativo, bloqueado        | `row.usuario.status`                    |
| Lojistas  | Todos, ativo, inativo, bloqueado        | `row.usuario.status`                    |
| Produtos  | Todos, ativo, rascunho, esgotado        | `row.status`                            |

Estilos: `admin-crud.css` (classes `.admin-crud-buscar*`).

---

## Regras de status nos formulários

### Usuário (`Usuarios/Form.jsx`)

- **Criar:** só **ativo** (campo desabilitado) → POST sempre com `status: "ativo"`.
- **Editar:** ativo, inativo, bloqueado — valor real vindo de GET `/usuarios/:id`.

### Lojista (`Lojistas/Form.jsx`)

- Status na tela = status do **usuário responsável** (não confundir com status da loja no banco: pendente/aprovado).
- **Criar:** usuário via modal nasce **ativo**.
- **Editar:** PUT `/usuarios/:id` para mudar ativo / inativo / bloqueado.

### Produto (`Produtos/Form.jsx`)

- **Criar:** ativo ou rascunho.
- **Editar:** ativo, rascunho, inativo, esgotado — valor de GET `/produtos/:id`.

---

## Arquivos principais

```
ayvy-react/src/
  services/
    api.js           → fetch base (URL, headers, erros)
    adminApi.js      → mapa de todas as funções e caminhos HTTP
  pages/Adim/
    README-ADMIN.md  → este guia
    Usuarios/
      index.jsx      → lista, Buscar, Excluir, link Editar
      Form.jsx       → criar/editar (POST/PUT usuarios)
    Clientes/
      index.jsx
      Form.jsx       → POST/PUT clientes + modal POST usuarios
    Lojistas/
      index.jsx
      Form.jsx       → POST/PUT lojistas + PUT usuarios (status)
    Produtos/
      index.jsx
      Form.jsx       → POST/PUT produtos + imagens
    admin-crud.css   → estilos tabelas, alertas, menu Buscar
  components/Admin/
    UsuarioQuickModal.jsx  → POST /usuarios (rápido)
    ImageUploadField.jsx   → POST /upload
```

---

////// * DICA!!!!! * //////////////

Para achar mais rapido o que o proferssoar pedir entra em `ayvy-react/src/routes/AppRoutes.jsx` olha a rota que vc quer, segura o command ou ctrl e clica em cima do element, exemplo ( <Route path="usuarios/novo" element={<AdminUsuarioForm /> /> ) aqui vc clicaria em AdminUsuarioForm caso quisesse mudar elguma coisa la, o atalho te leva direto para lá


## Subir o back

Na pasta `back`:

```bash
./mvnw spring-boot:run
```

Sem o back rodando, as telas mostram erro de conexão em `http://localhost:8082`.

---

## Resumo em uma frase

**`adminApi.js`** diz *o que* chamar; **`Form.jsx` / `index.jsx`** dizem *quando* (botão Salvar, Excluir, etc.); **`api.js`** faz a requisição HTTP de fato; os **comentários `// GET/POST/PUT/DELETE`** em cima de cada linha ligam tudo isso na hora de ler o código.
