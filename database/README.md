# AYVY — Banco de dados (SQL Server) · guia completo

SQL Server 2022 no Docker (`docker-compose.yml` na raiz), em `localhost,1433`, database **`ayvy`**.
A API cria e atualiza as tabelas sozinha (`ddl-auto=update`) a partir das entidades Java, e o
[`ayvySQL_DER.sql`](ayvySQL_DER.sql) é o **modelo oficial documentado**. Os links abaixo vão direto para a linha de cada tabela.
Mapa geral: [../README.md](../README.md) · back: [../back/README.md](../back/README.md).

## Índice

1. [Arquivos](#1-arquivos)
2. [Como conectar](#2-como-conectar)
3. [Tabelas (com a linha no DER)](#3-tabelas-com-a-linha-no-der)
4. [Status e papéis](#4-status-e-papéis)
5. [Consultas úteis](#5-consultas-úteis)
6. [Pontos de atenção (onde mais dá erro)](#6-pontos-de-atenção-onde-mais-dá-erro)

---

## 1. Arquivos

| Arquivo | Para que serve |
|---|---|
| [`init-ayvy.sql`](init-ayvy.sql) | cria só a database `ayvy` ([linha](init-ayvy.sql#L4)); roda sozinho no `docker compose up` |
| [`ayvySQL_DER.sql`](ayvySQL_DER.sql) | todas as tabelas, colunas, chaves e as categorias iniciais |
| [`drop-ayvy-tables.sql`](drop-ayvy-tables.sql) | apaga as tabelas na ordem certa das FKs ([tabelas novas primeiro](drop-ayvy-tables.sql#L8)) |
| [`ayvySQLEscola-antigo.sql`](ayvySQLEscola-antigo.sql) | versão antiga, só consulta |

## 2. Como conectar

- DBeaver/SSMS: servidor `localhost,1433`, usuário `sa`, senha a do `docker-compose.yml`, database `ayvy`.
- Mesma conexão da API: [../back/src/main/resources/application.properties](../back/src/main/resources/application.properties).
- Resetar tudo: rode `drop-ayvy-tables.sql` e depois suba a API (ela recria) ou rode o DER.

## 3. Tabelas (com a linha no DER)

| Tabela | Linha no DER | Entidade Java | O que guarda | Liga com |
|---|---|---|---|---|
| `usuarios` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L18) | `Usuario` | login de todos: e-mail, senha BCrypt, papel, status, telefone, avatar | base de tudo |
| `clientes` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L37) | `Cliente` | CPF e dados do comprador | 1:1 `usuarios` |
| `enderecos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L50) | `Endereco` | endereços; o principal do lojista é a origem do frete | N:1 `usuarios` |
| `notificacoes` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L71) | `Notificacoes` | avisos (`pedido`, `pedido_loja`, `pedido_admin`, `estoque`) | N:1 `usuarios` |
| `lojistas` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L87) | `Lojista` | loja: nome, slug, CNPJ, logo, banner, **sigla** (`LU`) | 1:1 `usuarios` |
| `categorias` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L107) | `Categoria` | árvore: `categoria_pai_id` (NULL = principal), `icone`, `ordem` | ela mesma |
| `produtos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L126) | `Produto` | nome, preço, **desconto_percentual**, status (a coluna `estoque` é antiga: o estoque real está em `produto_variacoes`) | N:1 `lojistas`, `categorias` |
| `produto_categorias_extras` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L194) | (Produto.categoriasExtras) | categorias a mais (tênis também em Streetwear) | N:N |
| `produto_imagens` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L205) | `ProdutoImagem` | galeria de fotos | N:1 `produtos` |
| `pedidos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L219) | `Pedido` | valores, status e envio (local, transportadora, rastreio, datas) | N:1 `usuarios` |
| `pedido_endereco_entrega` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L245) | `PedidoEnderecoEntrega` | cópia do endereço no momento da compra | 1:1 `pedidos` |
| `pedido_produtos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L265) | `PedidoProdutos` | itens com cor/tamanho e **codigo_pedido_loja** (`LU-1`) | N:1 `pedidos`, `produtos`, `lojistas` |
| `pagamentos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L306) | `Pagamento` | **tipo** de pagamento e status (sem cartão) | N:1 `pedidos` |
| `historico_compras` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L323) | `HistoricoCompras` | linha do tempo do pedido | N:1 `pedidos` |
| `favoritos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L343) | `Favoritos` | favoritos (os mesmos no site e no app) | N:1 `usuarios`, `produtos` |
| `visualizacoes_produtos` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L363) | `VisualizacoesProduto` | cada visualização (ranking) | N:1 `produtos` |
| `carrinho_itens` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L380) | `CarrinhoItem` | carrinho da conta (site + app) | N:1 `usuarios`, `produtos` |
| `produto_variacoes` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L165) | `ProdutoVariacao` | tamanho + cor + **estoque** + ativo; única por (produto, tamanho, cor) | N:1 `produtos`; 1:N `pedido_produtos` |
| `redefinicao_senha` | [ayvySQL_DER.sql](ayvySQL_DER.sql#L413) | `RedefinicaoSenha` | códigos de recuperação (só hash, validade, tentativas) | N:1 `usuarios` |

Categorias iniciais do DER: [INSERT INTO categorias](ayvySQL_DER.sql#L430) (a árvore completa é criada pela API no `CategoriaArvoreBootstrap`).

## 4. Status e papéis

- `pedidos.status`: `aguardando_pagamento` → `pago` → `em_separacao` → `enviado` → `entregue`. `cancelado` e `reembolsado` devolvem o estoque.
- `produtos.status`: `rascunho`, `ativo` (aparece no site), `inativo`, `esgotado`.
- `lojistas.status`: `pendente`, `aprovado`, `rejeitado`, `suspenso`.
- `usuarios.papel`: `admin`, `cliente`, `lojista`. `usuarios.status`: `ativo`, `inativo`, `bloqueado`.

## 5. Consultas úteis

```sql
-- pedido pelo código da loja (o mesmo que aparece no site como #LU-1)
SELECT p.* FROM pedidos p JOIN pedido_produtos pp ON pp.pedido_id = p.id WHERE pp.codigo_pedido_loja = 'LU-1';

-- árvore de categorias
SELECT pai.nome AS principal, c.nome AS subcategoria
FROM categorias c LEFT JOIN categorias pai ON pai.id = c.categoria_pai_id ORDER BY pai.ordem, c.ordem;

-- estoque por variação (cor + tamanho) dos produtos de uma loja
SELECT pr.nome, v.cor, v.tamanho, v.estoque, v.ativo FROM produto_variacoes v JOIN produtos pr ON pr.id = v.produto_id WHERE pr.lojista_id = 3;

-- carrinho de um cliente
SELECT pr.nome, c.quantidade, c.cor, c.tamanho FROM carrinho_itens c JOIN produtos pr ON pr.id = c.produto_id WHERE c.usuario_id = 2;

-- linha do tempo de um pedido
SELECT evento, descricao, criado_em FROM historico_compras WHERE pedido_id = 1 ORDER BY criado_em;
```

## 6. Pontos de atenção (onde mais dá erro)

1. **DER × API**: quem manda é a entidade Java (`ddl-auto=update`). Mudou uma coluna no Java? Atualize o DER também, para a documentação não ficar diferente do banco.
2. **Apagar tabela com FK**: sempre na ordem do `drop-ayvy-tables.sql`; primeiro as tabelas que apontam para outras.
3. **`UNIQUE` com NULL no SQL Server**: só um NULL por coluna única. Por isso `lojistas.sigla` não é `unique`.
4. **`ddl-auto=update` não apaga coluna**: colunas antigas continuam no banco. Para limpar, use o drop e recrie.
5. **Senha do `sa`**: se mudar no `docker-compose.yml`, mude também em `application.properties` (`DB_PASSWORD`).
6. **Banco antigo + estoque por variação**: se o Spring não sobe com `Invalid column name 'produto_variacao_id'`, crie a coluna (sem apagar nada) e suba de novo:
   ```sql
   ALTER TABLE dbo.pedido_produtos ADD produto_variacao_id INT NULL;
   ```
   Ela fica NULL nos pedidos antigos; os novos sempre gravam a variação. A tabela `estoque_itens` (planilha antiga) não é mais usada e pode ficar no banco.
7. **Visualização sem login dando 500**: em banco antigo, `visualizacoes_produtos.usuario_id` ainda é NOT NULL (o `ddl-auto=update` não muda isso). Libere o NULL (visitante sem login):
   ```sql
   ALTER TABLE dbo.visualizacoes_produtos ALTER COLUMN usuario_id INT NULL;
   ```
