-- =====================================================================
-- SCRIPT DDL - SQL Server (modelo DER) — alinhado ao backend Spring/JPA
-- Base: Diagrama Entidade-Relacionamento (marketplace)
-- Extra: tabelas/colunas necessárias para o que já funciona na API
-- Compatível com DBeaver (sem GO)
-- =====================================================================
DROP DATABASE ayvy;
GO
CREATE DATABASE ayvy;
GO
USE ayvy;
GO

-- ---------------------------------------------------------------------
-- Tabela: usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    papel            VARCHAR(50) NOT NULL,
    nome             VARCHAR(150) NOT NULL,
    nome_usuario     VARCHAR(80) NULL , --foi retirado o UNIQUE dessa coluna, pois impedia a criação de novos uuários
    email            VARCHAR(191) NOT NULL UNIQUE,
    senha_hash       VARCHAR(255) NOT NULL,
    telefone         VARCHAR(20) NULL,
    avatar_url       VARCHAR(500) NULL,
    status           VARCHAR(30) NOT NULL CONSTRAINT DF_usuarios_status DEFAULT 'ativo',
    ultimo_login_em  DATETIME2 NULL,
    criado_em        DATETIME2 NOT NULL CONSTRAINT DF_usuarios_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em    DATETIME2 NOT NULL CONSTRAINT DF_usuarios_atualizado_em DEFAULT SYSUTCDATETIME()
);

-- ---------------------------------------------------------------------
-- Tabela: clientes (1:1 com usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id       INT NOT NULL UNIQUE,
    cpf              CHAR(11) NOT NULL UNIQUE,
    data_nascimento  DATE NULL,
    CONSTRAINT fk_clientes_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: enderecos (1:N com usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE enderecos (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id    INT NOT NULL,
    apelido       VARCHAR(60) NULL,
    logradouro    VARCHAR(200) NOT NULL,
    numero        VARCHAR(20) NOT NULL,
    complemento   VARCHAR(100) NULL,
    bairro        VARCHAR(100) NOT NULL,
    cidade        VARCHAR(100) NOT NULL,
    uf            CHAR(2) NOT NULL,
    cep           CHAR(8) NOT NULL,
    principal     BIT NOT NULL CONSTRAINT DF_enderecos_principal DEFAULT 0,
    criado_em     DATETIME2 NOT NULL CONSTRAINT DF_enderecos_criado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_enderecos_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: notificacoes (1:N com usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE notificacoes (
    id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id   INT NOT NULL,
    titulo       VARCHAR(150) NOT NULL,
    mensagem     VARCHAR(500) NOT NULL,
    tipo         VARCHAR(50) NOT NULL CONSTRAINT DF_notificacoes_tipo DEFAULT 'info',
    lida         BIT NOT NULL CONSTRAINT DF_notificacoes_lida DEFAULT 0,
    lida_em      DATETIME2 NULL,
    CONSTRAINT fk_notificacoes_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: lojistas (1:1 com usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE lojistas (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id    INT NOT NULL UNIQUE,
    nome_loja     VARCHAR(150) NOT NULL,
    slug          VARCHAR(150) NOT NULL UNIQUE,
    cnpj          CHAR(14) NOT NULL UNIQUE,
    descricao     NVARCHAR(MAX) NULL,
    logo_url      VARCHAR(500) NULL,
    banner_url    VARCHAR(500) NULL,
    status_loja   VARCHAR(30) NOT NULL CONSTRAINT DF_lojistas_status DEFAULT 'aprovado',
    aprovado_em   DATETIME2 NULL,
    CONSTRAINT fk_lojistas_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: categorias
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL,
    slug   VARCHAR(100) NOT NULL UNIQUE,
    ativo  BIT NOT NULL CONSTRAINT DF_categorias_ativo DEFAULT 1
);

-- ---------------------------------------------------------------------
-- Tabela: produtos (N:1 com lojistas e categorias)
-- ---------------------------------------------------------------------
CREATE TABLE produtos (
    id                     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    lojista_id             INT NOT NULL,
    categoria_id           INT NULL,
    nome                   VARCHAR(200) NOT NULL,
    slug                   VARCHAR(150) NOT NULL,
    descricao              NVARCHAR(MAX) NULL,
    preco                  DECIMAL(12,2) NOT NULL,
    estoque                INT NOT NULL CONSTRAINT DF_produtos_estoque DEFAULT 0,
    imagem_principal_url   VARCHAR(500) NULL,
    visualizacoes_total    INT NOT NULL CONSTRAINT DF_produtos_visualizacoes DEFAULT 0,
    status                 VARCHAR(30) NOT NULL CONSTRAINT DF_produtos_status DEFAULT 'rascunho',
    criado_em              DATETIME2 NOT NULL CONSTRAINT DF_produtos_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em          DATETIME2 NOT NULL CONSTRAINT DF_produtos_atualizado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_produtos_lojista_slug UNIQUE (lojista_id, slug),
    CONSTRAINT fk_produtos_lojistas
        FOREIGN KEY (lojista_id) REFERENCES lojistas(id),
    CONSTRAINT fk_produtos_categorias
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- ---------------------------------------------------------------------
-- Tabela: produto_imagens (1:N com produtos) — usada pelo admin/API
-- ---------------------------------------------------------------------
CREATE TABLE produto_imagens (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    produto_id  INT NOT NULL,
    url         VARCHAR(500) NOT NULL,
    ordem       SMALLINT NOT NULL CONSTRAINT DF_produto_imagens_ordem DEFAULT 0,
    CONSTRAINT fk_produto_imagens_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- ---------------------------------------------------------------------
-- Tabela: pedidos (N:1 com usuarios - comprador)
-- Coluna usuario_id alinhada ao JPA (Pedido.usuario)
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id      INT NOT NULL,
    status          VARCHAR(30) NOT NULL CONSTRAINT DF_pedidos_status DEFAULT 'aguardando_pagamento',
    valor_subtotal  DECIMAL(12,2) NOT NULL CONSTRAINT DF_pedidos_valor_subtotal DEFAULT 0,
    valor_frete     DECIMAL(12,2) NOT NULL CONSTRAINT DF_pedidos_valor_frete DEFAULT 0,
    valor_total     DECIMAL(12,2) NOT NULL CONSTRAINT DF_pedidos_valor_total DEFAULT 0,
    observacao      VARCHAR(500) NULL,
    criado_em       DATETIME2 NOT NULL CONSTRAINT DF_pedidos_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em   DATETIME2 NOT NULL CONSTRAINT DF_pedidos_atualizado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pedidos_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: pedido_endereco_entrega (1:1 com pedidos)
-- ---------------------------------------------------------------------
CREATE TABLE pedido_endereco_entrega (
    pedido_id     INT NOT NULL PRIMARY KEY,
    logradouro    VARCHAR(200) NOT NULL,
    numero        VARCHAR(20) NOT NULL,
    complemento   VARCHAR(100) NULL,
    bairro        VARCHAR(100) NOT NULL,
    cidade        VARCHAR(100) NOT NULL,
    uf            CHAR(2) NOT NULL,
    cep           CHAR(8) NOT NULL,
    CONSTRAINT fk_pedido_endereco_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- ---------------------------------------------------------------------
-- Tabela: pedido_produtos (N:N entre pedidos e produtos, com lojista)
-- ---------------------------------------------------------------------
CREATE TABLE pedido_produtos (
    id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pedido_id        INT NOT NULL,
    produto_id       INT NOT NULL,
    lojista_id       INT NOT NULL,
    quantidade       INT NOT NULL CONSTRAINT DF_pedido_produtos_quantidade DEFAULT 1,
    preco_unitario   DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_pedido_produtos_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_pedido_produtos_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT fk_pedido_produtos_lojistas
        FOREIGN KEY (lojista_id) REFERENCES lojistas(id)
);

-- ---------------------------------------------------------------------
-- Tabela: pagamentos (N:1 com pedidos)
-- ---------------------------------------------------------------------
CREATE TABLE pagamentos (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pedido_id   INT NOT NULL,
    valor       DECIMAL(12,2) NOT NULL,
    status      VARCHAR(30) NOT NULL CONSTRAINT DF_pagamentos_status DEFAULT 'pendente',
    tipo        VARCHAR(50) NOT NULL,
    referencia  VARCHAR(191) NULL,
    pago_em     DATETIME2 NULL,
    criado_em   DATETIME2 NOT NULL CONSTRAINT DF_pagamentos_criado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pagamentos_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- ---------------------------------------------------------------------
-- Tabela: historico_compras — usada no checkout / status do pedido
-- ---------------------------------------------------------------------
CREATE TABLE historico_compras (
    id                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pedido_id         INT NOT NULL,
    evento            VARCHAR(80) NOT NULL,
    status_pedido     VARCHAR(50) NULL,
    descricao         VARCHAR(500) NULL,
    actor_usuario_id  INT NULL,
    criado_em         DATETIME2 NOT NULL CONSTRAINT DF_historico_compras_criado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_historico_compras_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_historico_compras_actor
        FOREIGN KEY (actor_usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Tabela: favoritos (N:N entre usuarios e produtos)
-- ---------------------------------------------------------------------
CREATE TABLE favoritos (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id  INT NOT NULL,
    produto_id  INT NOT NULL,
    criado_em   DATETIME2 NOT NULL CONSTRAINT DF_favoritos_criado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_favoritos_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_favoritos_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT uq_favoritos_usuario_produto UNIQUE (usuario_id, produto_id)
);

-- ---------------------------------------------------------------------
-- Tabela: visualizacoes_produtos (N:N entre produtos e usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE visualizacoes_produtos (
    id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    produto_id       INT NOT NULL,
    usuario_id       INT NOT NULL,
    visualizado_em   DATETIME2 NOT NULL CONSTRAINT DF_visualizacoes_visualizado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_visualizacoes_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT fk_visualizacoes_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Seeds mínimos (categorias) — evita admin vazio
-- ---------------------------------------------------------------------
INSERT INTO categorias (nome, slug, ativo) VALUES
    (N'Moda feminina', N'moda-feminina', 1),
    (N'Streetwear', N'streetwear', 1),
    (N'Acessórios', N'acessorios', 1),
    (N'Calçados', N'calcados', 1);


  SELECT * FROM usuarios;
