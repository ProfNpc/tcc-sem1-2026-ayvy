# AYVY — API (Spring Boot) · guia completo do back

API REST do marketplace em **http://localhost:8082**. Clique nos links para abrir a linha exata; no topo de cada
classe há um comentário explicando para que ela serve.
Guia antigo bem detalhado (SQL Server, Postman, cadastro em 2 passos): [README-GUIA.md](./README-GUIA.md) ·
Mapa geral: [../README.md](../README.md).

## Índice

1. [Como rodar](#1-como-rodar)
2. [Configuração (application.properties)](#2-configuração-applicationproperties)
3. [Camadas do código](#3-camadas-do-código)
4. [Controllers — todas as rotas](#4-controllers--todas-as-rotas)
5. [Services — as regras de negócio](#5-services--as-regras-de-negócio)
6. [Entidades (tabelas)](#6-entidades-tabelas)
7. [Bootstraps (rodam ao subir)](#7-bootstraps-rodam-ao-subir)
8. [Fluxos completos](#8-fluxos-completos)
9. [E-mail e SMS](#9-e-mail-e-sms)
10. [Pontos de atenção (onde mais dá erro)](#10-pontos-de-atenção-onde-mais-dá-erro)

---

## 1. Como rodar

```bash
docker compose up -d          # na raiz: SQL Server + database ayvy
cd back
./mvnw spring-boot:run        # http://localhost:8082/produtos para testar
```

O Hibernate cria e atualiza as tabelas sozinho (`ddl-auto=update`). Não é preciso rodar o SQL antes.

## 2. Configuração (application.properties)

| O quê | Linha |
|---|---|
| Porta 8082 | [server.port](src/main/resources/application.properties#L22) |
| Conexão com o SQL Server | [spring.datasource.url](src/main/resources/application.properties#L26) |
| Tabelas automáticas (`update`) | [ddl-auto](src/main/resources/application.properties#L36) |
| E-mail (Gmail) | [spring.mail](src/main/resources/application.properties#L46) |
| SMS (Twilio) | [ayvy.sms.twilio](src/main/resources/application.properties#L53) |

## 3. Camadas do código

Pacote base: [`src/main/java/com/ayvy/api_java`](src/main/java/com/ayvy/api_java)

```
HTTP → controller/ (recebe) → business/ (regras) → infrastructure/repositories/ (consulta) → entities/ (tabelas)
```

| Pasta | Para que serve |
|---|---|
| `controller/` | URLs, parâmetros e corpo da requisição (sem regra de negócio) |
| `business/` | **regras**: validações, cálculos, estoque, notificações |
| `infrastructure/entities/` | cada classe = uma tabela do banco |
| `infrastructure/repositories/` | consultas (Spring Data JPA cria o SQL pelo nome do método) |
| `infrastructure/enums/` | status e papéis |
| `infrastructure/geo/` | CEP → coordenadas → distância (frete) |
| `dto/` | formato do JSON de entrada de alguns endpoints |
| `config/` | segurança, CORS, `/uploads` e bootstraps |
| `exception/` | erros viram `{ "detail": "mensagem" }` ([ApiExceptionHandler](src/main/java/com/ayvy/api_java/exception/ApiExceptionHandler.java#L17)) |

## 4. Controllers — todas as rotas

| Rota | Linha | Quem usa |
|---|---|---|
| `POST /usuarios/login` | [UsuarioController](src/main/java/com/ayvy/api_java/controller/UsuarioController.java#L54) | site e app |
| `POST /usuarios/recuperar-senha` · `/redefinir-senha` | [UsuarioController](src/main/java/com/ayvy/api_java/controller/UsuarioController.java#L34) | Esqueci a senha |
| `POST /usuarios` (cadastro) | [UsuarioController](src/main/java/com/ayvy/api_java/controller/UsuarioController.java#L49) | Cadastro |
| `/clientes` · `/lojistas` | [ClienteController](src/main/java/com/ayvy/api_java/controller/ClienteController.java#L17) · [LojistaController](src/main/java/com/ayvy/api_java/controller/LojistaController.java#L17) | Cadastro, admin, vitrine |
| `/produtos` + `/produtos/{id}/imagens` | [ProdutoController](src/main/java/com/ayvy/api_java/controller/ProdutoController.java#L58) | vitrine, lojista, admin |
| `/categorias` | [CategoriaController](src/main/java/com/ayvy/api_java/controller/CategoriaController.java#L16) | Categorias, cadastro de produto |
| `POST /pedidos/checkout` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L38) | Checkout |
| `PUT /pedidos/{id}/status` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L83) | pago, preparo, cancelar, admin |
| `PUT /pedidos/{id}/recebido` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L90) | lojista |
| `PUT /pedidos/{id}/envio` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L96) | lojista (despachar) |
| `PUT /pedidos/{id}/entrega-confirmada` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L101) | cliente |
| `GET /pedidos/{id}/historico` · `/codigo/{codigo}` | [PedidoController](src/main/java/com/ayvy/api_java/controller/PedidoController.java#L106) | admin, busca `LU-1` |
| `/carrinho` (GET/PUT/DELETE) | [CarrinhoController](src/main/java/com/ayvy/api_java/controller/CarrinhoController.java#L32) | site e app |
| `/produtos/{id}/variacoes` (GET, `/ativas`, POST, PUT `/{variacaoId}`, PATCH `/desativar` e `/ativar`) | [ProdutoVariacaoController](src/main/java/com/ayvy/api_java/controller/ProdutoVariacaoController.java#L29) | Novo produto, página do produto, checkout, Meu estoque |
| `GET /estoque/relatorio` | [EstoqueController](src/main/java/com/ayvy/api_java/controller/EstoqueController.java#L22) | Meu estoque (gráfico e movimentos) |
| `POST /frete/calcular` | [FreteController](src/main/java/com/ayvy/api_java/controller/FreteController.java#L35) | Carrinho, Checkout |
| `/favoritos` | [FavoritosController](src/main/java/com/ayvy/api_java/controller/FavoritosController.java#L42) | site e app |
| `/notificacoes` · `/pagamentos` · `/enderecos` | [Notificacoes](src/main/java/com/ayvy/api_java/controller/NotificacoesController.java#L17) · [Pagamento](src/main/java/com/ayvy/api_java/controller/PagamentoController.java#L17) · [Endereco](src/main/java/com/ayvy/api_java/controller/EnderecoController.java#L15) | várias telas |
| `POST /upload` | [UploadController](src/main/java/com/ayvy/api_java/controller/UploadController.java#L33) | fotos |
| `/visualizacoes` | [VisualizacoesProdutoController](src/main/java/com/ayvy/api_java/controller/VisualizacoesProdutoController.java#L11) | página do produto |

## 5. Services — as regras de negócio

| Service | Método | O que faz |
|---|---|---|
| PedidoService | [finalizarCheckout](src/main/java/com/ayvy/api_java/business/PedidoService.java#L383) | exige `produtoVariacaoId`, trava a variação ([buscarPorIdComBloqueio](src/main/java/com/ayvy/api_java/business/PedidoService.java#L412)), **baixa o estoque da variação**, calcula frete, grava pedido, itens (código `LU-1`) e endereço |
| | [atualizarStatus](src/main/java/com/ayvy/api_java/business/PedidoService.java#L117) | muda status; **cancelado/reembolsado devolve as peças** ao estoque; notifica |
| | [registrarEnvio](src/main/java/com/ayvy/api_java/business/PedidoService.java#L182) · [confirmarRecebimento](src/main/java/com/ayvy/api_java/business/PedidoService.java#L228) · [confirmarEntregaPeloCliente](src/main/java/com/ayvy/api_java/business/PedidoService.java#L247) | fluxo de envio |
| | [notificarLojistas](src/main/java/com/ayvy/api_java/business/PedidoService.java#L296) · [notificarAdmins](src/main/java/com/ayvy/api_java/business/PedidoService.java#L311) | avisos para loja e admin |
| | [baixarEstoque](src/main/java/com/ayvy/api_java/business/PedidoService.java#L357) · [devolverEstoque](src/main/java/com/ayvy/api_java/business/PedidoService.java#L346) · [avisarReporEstoque](src/main/java/com/ayvy/api_java/business/PedidoService.java#L372) | tira/devolve da variação; avisa a loja quando zera |
| EstoqueService | [relatorio](src/main/java/com/ayvy/api_java/business/EstoqueService.java#L56) · [ItemVendido](src/main/java/com/ayvy/api_java/business/EstoqueService.java#L51) | vendas por mês, movimentos e vendidos por variação (com cor) |
| CarrinhoService | [substituir](src/main/java/com/ayvy/api_java/business/CarrinhoService.java#L54) | salva o carrinho inteiro (soma repetidos, limita ao [estoque da variação](src/main/java/com/ayvy/api_java/business/CarrinhoService.java#L95)) |
| ProdutoService | [atualizarProdutoPorId](src/main/java/com/ayvy/api_java/business/ProdutoService.java#L122) · [resolverCategoriasExtras](src/main/java/com/ayvy/api_java/business/ProdutoService.java#L55) | PUT parcial, desconto, categorias extras |
| RecuperacaoSenhaService | [solicitarCodigo](src/main/java/com/ayvy/api_java/business/RecuperacaoSenhaService.java#L68) · [redefinirSenha](src/main/java/com/ayvy/api_java/business/RecuperacaoSenhaService.java#L104) · [mostrarNoConsole](src/main/java/com/ayvy/api_java/business/RecuperacaoSenhaService.java#L168) | código de 6 dígitos (hash, 15 min, 5 tentativas) |
| SmsService | [enviar](src/main/java/com/ayvy/api_java/business/SmsService.java#L51) | SMS pelo Twilio (sem SDK) |
| FreteService | [calcularFreteTotal](src/main/java/com/ayvy/api_java/business/FreteService.java#L44) · [faixas de preço](src/main/java/com/ayvy/api_java/business/FreteService.java#L79) | distância entre CEPs → valor |
| UsuarioService | [autenticar](src/main/java/com/ayvy/api_java/business/UsuarioService.java#L196) · [deletarUsuario](src/main/java/com/ayvy/api_java/business/UsuarioService.java#L78) | login BCrypt; excluir apaga códigos e carrinho |
| SiglaLojaService | [gerarSiglaUnica](src/main/java/com/ayvy/api_java/business/SiglaLojaService.java#L30) | "Loja Urbana" → `LU` |
| UploadService | [salvarImagem](src/main/java/com/ayvy/api_java/business/UploadService.java#L52) | grava em `back/uploads/` |

## 6. Entidades (tabelas)

| Entidade | Tabela | Destaques |
|---|---|---|
| [Usuario](src/main/java/com/ayvy/api_java/infrastructure/entities/Usuario.java#L24) | `usuarios` | [senha nunca sai no JSON](src/main/java/com/ayvy/api_java/infrastructure/entities/Usuario.java#L43) |
| [Produto](src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java#L33) | `produtos` | [getPrecoFinal (desconto)](src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java#L141) · [categoriasExtras](src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java#L52) · [estoqueDisponivel (soma das variações)](src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java#L134) |
| [Pedido](src/main/java/com/ayvy/api_java/infrastructure/entities/Pedido.java#L26) | `pedidos` | [getEtapaEnvio (linha de envio)](src/main/java/com/ayvy/api_java/infrastructure/entities/Pedido.java#L110) |
| [PedidoProdutos](src/main/java/com/ayvy/api_java/infrastructure/entities/PedidoProdutos.java#L20) | `pedido_produtos` | código `LU-1` por loja |
| [Categoria](src/main/java/com/ayvy/api_java/infrastructure/entities/Categoria.java#L18) | `categorias` | árvore (categoriaPai) |
| [ProdutoVariacao](src/main/java/com/ayvy/api_java/infrastructure/entities/ProdutoVariacao.java#L15) | `produto_variacoes` | tamanho + cor + estoque + ativo (o estoque real do produto) |
| [CarrinhoItem](src/main/java/com/ayvy/api_java/infrastructure/entities/CarrinhoItem.java#L21) | `carrinho_itens` | carrinho do site e do app |
| [RedefinicaoSenha](src/main/java/com/ayvy/api_java/infrastructure/entities/RedefinicaoSenha.java#L17) | `redefinicao_senha` | só o hash do código |
| Demais | `clientes`, `lojistas`, `enderecos`, `notificacoes`, `pagamentos`, `historico_compras`, `favoritos`, `produto_imagens`, `visualizacoes_produtos`, `pedido_endereco_entrega` | ver [database/README.md](../database/README.md) |

## 7. Bootstraps (rodam ao subir)

| Ordem | Classe | O que faz |
|---|---|---|
| 2 | [DevSeedBootstrap](src/main/java/com/ayvy/api_java/config/DevSeedBootstrap.java#L30) | lojas, produtos e clientes de exemplo ([senha dos lojistas](src/main/java/com/ayvy/api_java/config/DevSeedBootstrap.java#L34)) |
| 3 | [PedidoNumeroLojaBootstrap](src/main/java/com/ayvy/api_java/config/PedidoNumeroLojaBootstrap.java#L27) | sigla da loja e código `LU-1` de pedidos antigos |
| 4 | [CategoriaArvoreBootstrap](src/main/java/com/ayvy/api_java/config/CategoriaArvoreBootstrap.java#L24) | [árvore de categorias](src/main/java/com/ayvy/api_java/config/CategoriaArvoreBootstrap.java#L32), [junta repetidas](src/main/java/com/ayvy/api_java/config/CategoriaArvoreBootstrap.java#L171) |
| 5 | [DemoDataBootstrap](src/main/java/com/ayvy/api_java/config/DemoDataBootstrap.java#L33) | mais produtos, pedidos e favoritos de demonstração |
| 6 | [ImagensSeedBootstrap](src/main/java/com/ayvy/api_java/config/ImagensSeedBootstrap.java#L39) | copia de `IMAGENS/` as fotos que faltam em `back/uploads` |
| último | [AdminBootstrap](src/main/java/com/ayvy/api_java/config/AdminBootstrap.java#L19) | conta admin (`admin@ayvy.com.br` / `admin123`) |

## 8. Fluxos completos

**Compra**
1. O checkout chama [finalizarCheckout](src/main/java/com/ayvy/api_java/business/PedidoService.java#L383).
2. Cada item vem com `produtoVariacaoId`; a variação é travada no banco ([buscarPorIdComBloqueio](src/main/java/com/ayvy/api_java/business/PedidoService.java#L412)) e o estoque dela é baixado. Cor e tamanho do item vêm da variação.
3. O preço vem de `getPrecoFinal()`, já com o desconto. O preço que vem do front nunca é usado.
4. O front marca o pedido como `pago`. Com isso, cliente, loja e admin são notificados.

**Envio**
1. O lojista confirma o recebimento (`/recebido`).
2. O lojista começa o preparo (`status=em_separacao`).
3. O lojista despacha (`/envio`).
4. A etapa avança sozinha com o tempo (`Pedido.getEtapaEnvio`).
5. O cliente confirma a entrega (`/entrega-confirmada`).

**Estoque**
- O estoque fica em `produto_variacoes` (uma linha por cor + tamanho). A coluna `produtos.estoque` é antiga e **não é mais atualizada**: para saber se está esgotado use `estoqueDisponivel` (soma das variações ativas, só leitura no JSON).
- Variação desativada some da loja, mas continua no banco (pedidos antigos apontam para ela).
- Uma venda tira da variação comprada.
- Um cancelamento ou reembolso devolve a peça.
- Quando uma linha zera, a loja recebe uma notificação "Repor estoque".

**Carrinho entre site e app**
- Os dois mandam o carrinho inteiro (`PUT /carrinho`) e leem com `GET /carrinho`.
- Linhas iguais são somadas e a quantidade é limitada ao estoque da variação (cor + tamanho).

**Senha**
1. `solicitarCodigo` gera o código e o envia por e-mail, por SMS ou, sem configuração, mostra no console.
2. `redefinirSenha` confere o código e grava a nova senha em BCrypt.

## 9. E-mail e SMS

Sem configuração, o código de recuperação aparece no **console do Spring** (busque `RECUPERAÇÃO DE SENHA`).
- **Gmail:** `SPRING_MAIL_HOST=smtp.gmail.com`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (senha de app).
- **Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.

## 10. Pontos de atenção (onde mais dá erro)

1. **"No qualifying bean of type PasswordEncoder" ou classe não encontrada depois de mudar o código**: o reinício automático do DevTools pegou a compilação pela metade, ou entrou uma biblioteca nova no `pom.xml`. Pare (Ctrl+C) e rode `./mvnw spring-boot:run` de novo.
2. **Foto quebrada no site**: `back/uploads` está no `.gitignore`. Coloque o arquivo com o mesmo nome em `IMAGENS/`; o [ImagensSeedBootstrap](src/main/java/com/ayvy/api_java/config/ImagensSeedBootstrap.java#L69) copia ao subir.
3. **Erro 409 ao excluir**: o registro ainda é usado em outra tabela (FK). Por isso `deletarUsuario` e `deletarProdutoPorId` apagam antes os itens ligados.
4. **`@Transactional` + erro = tudo desfeito**: em [atualizarStatus](src/main/java/com/ayvy/api_java/business/PedidoService.java#L117), se faltar estoque ao reativar um pedido, nada é salvo pela metade.
5. **PUT parcial apagando campo**: campos sem valor padrão de propósito (`descontoPercentual`, `categoriasExtras` em [Produto](src/main/java/com/ayvy/api_java/infrastructure/entities/Produto.java)). Não coloque `@Builder.Default` neles.
6. **SQL Server e `UNIQUE` com NULL**: só aceita um NULL por coluna única. Por isso `lojistas.sigla` não é `unique`.
7. **Segurança**: [permitAll](src/main/java/com/ayvy/api_java/config/SecurityFilterChainConfig.java#L27). A API não exige token; quem protege as telas é o front.
8. **CORS**: só `localhost:5173` e `5174` ([allowedOrigins](src/main/java/com/ayvy/api_java/config/WebConfig.java#L35)).
9. **Frete sem internet**: a distância usa a BrasilAPI ([CepGeoLocalizacaoClient](src/main/java/com/ayvy/api_java/infrastructure/geo/CepGeoLocalizacaoClient.java)).
10. **"Invalid column name 'produto_variacao_id'" ao subir**: o `ddl-auto=update` não consegue criar coluna NOT NULL numa tabela que já tem linhas. Em banco antigo, crie a coluna à mão (ver [database/README.md](../database/README.md)).
11. **"not-null property references a null value ... Produto.estoque"**: com `@Builder.Default` o Jackson deixa `estoque` nulo quando o JSON não manda o campo. O [aplicarDefaults](src/main/java/com/ayvy/api_java/business/ProdutoService.java#L90) põe 0 (a coluna antiga ainda é NOT NULL).
12. **Visualizações**: visitante sem login grava com `usuario = null` e o total soma direto no banco ([somarVisualizacao](src/main/java/com/ayvy/api_java/infrastructure/repositories/ProdutoRepository.java#L31)), para duas visitas ao mesmo tempo não virarem uma. Banco antigo: ver o `ALTER TABLE` no [database/README.md](../database/README.md).
