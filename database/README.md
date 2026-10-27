# AYVY — banco de dados (SQL Server)

O banco roda no **SQL Server 2022** via Docker (`docker-compose.yml` na raiz), em `localhost:1433`, database **`ayvy`**.
A API Spring Boot está com `spring.jpa.hibernate.ddl-auto=update`: ao subir, ela **cria/atualiza as tabelas sozinha**
a partir das entidades em `back/src/main/java/com/ayvy/api_java/infrastructure/entities/`.
Os scripts abaixo servem para documentação, criar tudo do zero ou resetar.

| Arquivo | Para que serve |
|---|---|
| `init-ayvy.sql` | Cria só a database `ayvy` (roda sozinho no `docker compose up`, serviço `sqlserver-init`) |
| `ayvySQL_DER.sql` | **Modelo oficial**: todas as tabelas, colunas, chaves e seeds de categorias |
| `drop-ayvy-tables.sql` | Apaga as tabelas para recomeçar (depois rode o DER de novo ou deixe a API recriar) |
| `ayvySQLEscola-antigo.sql` | Versão antiga, só para consulta |

Conexão usada pela API: `back/src/main/resources/application.properties` (`spring.datasource.*`).
No DBeaver/SSMS: servidor `localhost,1433`, usuário `sa`, senha a do `docker-compose.yml`.

---

## Tabelas e relacionamentos

| Tabela | Entidade Java | O que guarda | Ligações |
|---|---|---|---|
| `usuarios` | `Usuario` | login de todos (admin, cliente, lojista), senha em BCrypt, papel, status, telefone | base de tudo |
| `clientes` | `Cliente` | dados do cliente (CPF) | 1:1 `usuarios` |
| `lojistas` | `Lojista` | loja: nome, slug, CNPJ, logo, banner, **sigla** (ex.: `LU`) | 1:1 `usuarios` |
| `enderecos` | `Endereco` | endereços do usuário (o principal do lojista é a origem do frete) | N:1 `usuarios` |
| `categorias` | `Categoria` | árvore de categorias: `categoria_pai_id` (NULL = principal), `icone`, `ordem` | auto-relacionamento |
| `produtos` | `Produto` | nome, preço, estoque, status, cores, tamanhos, visualizações | N:1 `lojistas`, N:1 `categorias` |
| `produto_imagens` | `ProdutoImagem` | galeria de fotos do produto | N:1 `produtos` |
| `pedidos` | `Pedido` | pedido do cliente: valores, status e **dados de envio** (local de postagem, transportadora, código de rastreio, datas recebido/enviado/entregue) | N:1 `usuarios` |
| `pedido_produtos` | `PedidoProdutos` | itens do pedido com cor/tamanho e **código por loja** (`numero_pedido_loja`, `codigo_pedido_loja` ex.: `LU-1`) | N:1 `pedidos`, `produtos`, `lojistas` |
| `pedido_endereco_entrega` | `PedidoEnderecoEntrega` | cópia do endereço de entrega no momento da compra | 1:1 `pedidos` |
| `pagamentos` | `Pagamento` | tipo de pagamento e status (sem dados de cartão) | N:1 `pedidos` |
| `historico_compras` | `HistoricoCompras` | linha do tempo do pedido (criado, recebido, despachado, entregue…) | N:1 `pedidos`, `usuarios` |
| `notificacoes` | `Notificacoes` | avisos para cliente, lojista e admin (`tipo`: `pedido`, `pedido_loja`, `pedido_admin`) | N:1 `usuarios` |
| `favoritos` | `Favoritos` | produtos favoritos do cliente | N:1 `usuarios`, `produtos` |
| `visualizacoes_produtos` | `VisualizacoesProduto` | cada visualização de produto (ranking/métricas) | N:1 `produtos`, `usuarios` |
| `redefinicao_senha` | `RedefinicaoSenha` | códigos de recuperação de senha (só o **hash**, validade, tentativas) | N:1 `usuarios` |

### Status (enums em `back/.../infrastructure/enums/`)

- `StatusPedido`: `aguardando_pagamento`, `pago`, `em_separacao`, `enviado`, `entregue`, `cancelado`, `reembolsado`.
- `StatusProduto`: `rascunho`, `ativo`, `inativo`, `esgotado`.
- `StatusLoja`: `pendente`, `aprovado`, `rejeitado`, `suspenso`.
- `PapelUsuario`: `admin`, `cliente`, `lojista`. `StatusUsuario`: `ativo`, `inativo`, `bloqueado`.

### Consultas úteis

```sql
-- pedido pelo código da loja (o mesmo que aparece no site como #LU-1)
SELECT p.* FROM pedidos p
JOIN pedido_produtos pp ON pp.pedido_id = p.id
WHERE pp.codigo_pedido_loja = 'LU-1';

-- árvore de categorias
SELECT pai.nome AS principal, c.nome AS subcategoria
FROM categorias c LEFT JOIN categorias pai ON pai.id = c.categoria_pai_id
ORDER BY pai.ordem, c.ordem;

-- linha do tempo de um pedido
SELECT evento, descricao, criado_em FROM historico_compras WHERE pedido_id = 1 ORDER BY criado_em;
```
