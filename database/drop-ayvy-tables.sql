-- =====================================================================
-- DROP seguro das tabelas do modelo AYVY (ordem por FKs)
-- Depois rode ayvySQL_DER.sql
-- =====================================================================

USE ayvy;

IF OBJECT_ID(N'dbo.visualizacoes_produtos', N'U') IS NOT NULL DROP TABLE dbo.visualizacoes_produtos;
IF OBJECT_ID(N'dbo.favoritos', N'U') IS NOT NULL DROP TABLE dbo.favoritos;
IF OBJECT_ID(N'dbo.historico_compras', N'U') IS NOT NULL DROP TABLE dbo.historico_compras;
IF OBJECT_ID(N'dbo.pagamentos', N'U') IS NOT NULL DROP TABLE dbo.pagamentos;
IF OBJECT_ID(N'dbo.pedido_produtos', N'U') IS NOT NULL DROP TABLE dbo.pedido_produtos;
IF OBJECT_ID(N'dbo.pedido_endereco_entrega', N'U') IS NOT NULL DROP TABLE dbo.pedido_endereco_entrega;
IF OBJECT_ID(N'dbo.pedidos', N'U') IS NOT NULL DROP TABLE dbo.pedidos;
IF OBJECT_ID(N'dbo.produto_imagens', N'U') IS NOT NULL DROP TABLE dbo.produto_imagens;
IF OBJECT_ID(N'dbo.produtos', N'U') IS NOT NULL DROP TABLE dbo.produtos;
IF OBJECT_ID(N'dbo.categorias', N'U') IS NOT NULL DROP TABLE dbo.categorias;
IF OBJECT_ID(N'dbo.lojistas', N'U') IS NOT NULL DROP TABLE dbo.lojistas;
IF OBJECT_ID(N'dbo.notificacoes', N'U') IS NOT NULL DROP TABLE dbo.notificacoes;
IF OBJECT_ID(N'dbo.enderecos', N'U') IS NOT NULL DROP TABLE dbo.enderecos;
IF OBJECT_ID(N'dbo.clientes', N'U') IS NOT NULL DROP TABLE dbo.clientes;
IF OBJECT_ID(N'dbo.usuarios', N'U') IS NOT NULL DROP TABLE dbo.usuarios;
