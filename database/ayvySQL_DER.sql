
-- =====================================================================
-- SCRIPT DDL - SQL Server (modelo DER) — alinhado ao backend Spring/JPA
-- Base: Diagrama Entidade-Relacionamento (marketplace)
-- Extra: tabelas/colunas necessárias para o que já funciona na API
-- Compatível com DBeaver (sem GO, caso execute os comandos por seleção)
-- =====================================================================

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
    nome_usuario     VARCHAR(80) NULL, -- foi retirado o UNIQUE dessa coluna, pois impedia a criação de novos usuários
    email            VARCHAR(191) NOT NULL UNIQUE,
    senha_hash       VARCHAR(255) NOT NULL,
    telefone         VARCHAR(20) NULL,
    avatar_url       VARCHAR(500) NULL,
    status           VARCHAR(30) NOT NULL CONSTRAINT DF_usuarios_status DEFAULT 'ativo',
    ultimo_login_em  DATETIME2 NULL,
    criado_em        DATETIME2 NOT NULL CONSTRAINT DF_usuarios_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em    DATETIME2 NOT NULL CONSTRAINT DF_usuarios_atualizado_em DEFAULT SYSUTCDATETIME()
);
GO

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
GO

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
GO

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
GO

-- ---------------------------------------------------------------------
-- Tabela: lojistas (1:1 com usuarios)
-- ---------------------------------------------------------------------
CREATE TABLE lojistas (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id    INT NOT NULL UNIQUE,
    nome_loja     VARCHAR(150) NOT NULL,
    slug          VARCHAR(150) NOT NULL UNIQUE,
    sigla         VARCHAR(10) NULL,
    cnpj          CHAR(14) NOT NULL UNIQUE,
    descricao     NVARCHAR(MAX) NULL,
    logo_url      VARCHAR(500) NULL,
    banner_url    VARCHAR(500) NULL,
    status_loja   VARCHAR(30) NOT NULL CONSTRAINT DF_lojistas_status DEFAULT 'aprovado',
    aprovado_em   DATETIME2 NULL,
    CONSTRAINT fk_lojistas_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
GO

-- ---------------------------------------------------------------------
-- Tabela: categorias
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nome              VARCHAR(100) NOT NULL,
    slug              VARCHAR(100) NOT NULL UNIQUE,
    ativo             BIT NOT NULL CONSTRAINT DF_categorias_ativo DEFAULT 1,
    -- categoria principal (ex.: Moda Feminina); NULL quando já é principal
    categoria_pai_id  INT NULL,
    icone             VARCHAR(40) NULL,
    ordem             INT NULL,
    CONSTRAINT fk_categorias_pai
        FOREIGN KEY (categoria_pai_id) REFERENCES categorias(id)
);
GO

-- ---------------------------------------------------------------------
-- Tabela: produtos (N:1 com lojistas e categorias)
-- O estoque, as cores e os tamanhos são controlados individualmente
-- na tabela produto_variacoes.
-- ---------------------------------------------------------------------
CREATE TABLE produtos (
    id                     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    lojista_id             INT NOT NULL,
    categoria_id           INT NULL,
    nome                   VARCHAR(200) NOT NULL,
    slug                   VARCHAR(150) NOT NULL,
    descricao              NVARCHAR(MAX) NULL,
    preco                  DECIMAL(12,2) NOT NULL,

    desconto_percentual    INT NULL,  -- 0 a 90; preço final = preco * (100 - desconto) / 100
    estoque                INT NOT NULL CONSTRAINT DF_produtos_estoque DEFAULT 0,

    imagem_principal_url   VARCHAR(500) NULL,
    visualizacoes_total    INT NOT NULL CONSTRAINT DF_produtos_visualizacoes DEFAULT 0,
    status                 VARCHAR(30) NOT NULL CONSTRAINT DF_produtos_status DEFAULT 'rascunho',
    criado_em              DATETIME2 NOT NULL CONSTRAINT DF_produtos_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em          DATETIME2 NOT NULL CONSTRAINT DF_produtos_atualizado_em DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_produtos_lojista_slug UNIQUE (lojista_id, slug),

    CONSTRAINT ck_produtos_preco
        CHECK (preco >= 0),

    CONSTRAINT fk_produtos_lojistas
        FOREIGN KEY (lojista_id) REFERENCES lojistas(id),

    CONSTRAINT fk_produtos_categorias
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
GO

-- ---------------------------------------------------------------------
-- Tabela: produto_variacoes (1:N com produtos)
-- Cada registro representa uma combinação de tamanho e cor.
-- As opções são definidas livremente pelo lojista, sem valores
-- previamente estabelecidos pelo sistema.
-- Para produtos sem variação de tamanho, utilizar "Único".
-- A cor deve sempre ser informada (ex.: Preto, Transparente, Incolor).
-- ---------------------------------------------------------------------
CREATE TABLE produto_variacoes (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    produto_id  INT NOT NULL,
    tamanho     VARCHAR(30) NOT NULL,
    cor         VARCHAR(60) NOT NULL,
    estoque     INT NOT NULL CONSTRAINT DF_produto_variacoes_estoque DEFAULT 0,
    ativo       BIT NOT NULL CONSTRAINT DF_produto_variacoes_ativo DEFAULT 1,

    CONSTRAINT fk_produto_variacoes_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id),

    CONSTRAINT ck_produto_variacoes_estoque
        CHECK (estoque >= 0),

    -- Impede cadastrar duas vezes a mesma combinação para o mesmo produto.
    CONSTRAINT uq_produto_variacoes_combinacao
        UNIQUE (produto_id, tamanho, cor)
);
GO

-- Índice para localizar rapidamente as variações de um produto.
CREATE INDEX ix_produto_variacoes_produto
    ON produto_variacoes(produto_id);
GO

-- ---------------------------------------------------------------------
-- Tabela: produto_categorias_extras (N:N) — categorias a mais do produto
-- (ex.: tênis em Calçados › Tênis e também em Streetwear › Tênis streetwear)
-- ---------------------------------------------------------------------
CREATE TABLE produto_categorias_extras (
    produto_id    INT NOT NULL,
    categoria_id  INT NOT NULL,
    CONSTRAINT pk_produto_categorias_extras PRIMARY KEY (produto_id, categoria_id),
    CONSTRAINT fk_pce_produtos FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT fk_pce_categorias FOREIGN KEY (categoria_id) REFERENCES categorias(id)
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
GO

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
    transportadora  VARCHAR(60) NULL,
    codigo_rastreio VARCHAR(80) NULL,
    previsao_entrega DATE NULL,
    observacao_envio VARCHAR(500) NULL,
    local_postagem  VARCHAR(300) NULL,
    recebido_em     DATETIME2 NULL,
    enviado_em      DATETIME2 NULL,
    entregue_em     DATETIME2 NULL,
    criado_em       DATETIME2 NOT NULL CONSTRAINT DF_pedidos_criado_em DEFAULT SYSUTCDATETIME(),
    atualizado_em   DATETIME2 NOT NULL CONSTRAINT DF_pedidos_atualizado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pedidos_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
GO

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
GO

-- ---------------------------------------------------------------------
-- Tabela: pedido_produtos (N:N entre pedidos e produtos, com lojista)
-- produto_variacao_id identifica a variação efetivamente comprada.
-- cor e tamanho são mantidos como registro histórico da compra,
-- mesmo que a variação seja alterada posteriormente.
-- ---------------------------------------------------------------------
CREATE TABLE pedido_produtos (
    id                    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pedido_id             INT NOT NULL,
    produto_id            INT NOT NULL,
    produto_variacao_id   INT NOT NULL,
    lojista_id            INT NOT NULL,
    quantidade            INT NOT NULL CONSTRAINT DF_pedido_produtos_quantidade DEFAULT 1,
    preco_unitario        DECIMAL(12,2) NOT NULL,
    cor                   VARCHAR(60) NOT NULL,
    tamanho               VARCHAR(30) NOT NULL,
    numero_pedido_loja    INT NULL,
    codigo_pedido_loja    VARCHAR(20) NULL,

    CONSTRAINT ck_pedido_produtos_quantidade
        CHECK (quantidade > 0),

    CONSTRAINT ck_pedido_produtos_preco
        CHECK (preco_unitario >= 0),

    CONSTRAINT fk_pedido_produtos_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),

    CONSTRAINT fk_pedido_produtos_produtos
        FOREIGN KEY (produto_id) REFERENCES produtos(id),

    CONSTRAINT fk_pedido_produtos_variacoes
        FOREIGN KEY (produto_variacao_id) REFERENCES produto_variacoes(id),

    CONSTRAINT fk_pedido_produtos_lojistas
        FOREIGN KEY (lojista_id) REFERENCES lojistas(id)
);
GO

-- Índice para localizar os itens de pedido por variação.
CREATE INDEX ix_pedido_produtos_variacao
    ON pedido_produtos(produto_variacao_id);
GO

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
GO

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
GO

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

    CONSTRAINT uq_favoritos_usuario_produto
        UNIQUE (usuario_id, produto_id)
);
GO

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
GO

-- ---------------------------------------------------------------------
-- Tabela: carrinho_itens (carrinho salvo na conta: o mesmo no site e no app)
-- ---------------------------------------------------------------------
CREATE TABLE carrinho_itens (
    id             INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id     INT NOT NULL,
    produto_id     INT NOT NULL,
    produto_variacao_id INT NOT NULL,
    quantidade     INT NOT NULL,
    cor            VARCHAR(60) NULL,
    tamanho        VARCHAR(30) NULL,
    atualizado_em  DATETIME2 NOT NULL CONSTRAINT DF_carrinho_itens_atualizado_em DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_carrinho_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_carrinho_produtos FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT FK_carrinho_itens_produto_variacao FOREIGN KEY (produto_variacao_id) REFERENCES produto_variacoes(id)
);


-- ---------------------------------------------------------------------
-- Tabela: redefinicao_senha (códigos de recuperação de senha, só o hash)
-- ---------------------------------------------------------------------
CREATE TABLE redefinicao_senha (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario_id    INT NOT NULL,
    codigo_hash   VARCHAR(100) NOT NULL,
    expira_em     DATETIME2 NOT NULL,
    usado_em      DATETIME2 NULL,
    tentativas    INT NOT NULL CONSTRAINT DF_redefinicao_senha_tentativas DEFAULT 0,
    criado_em     DATETIME2 NOT NULL CONSTRAINT DF_redefinicao_senha_criado_em DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_redefinicao_senha_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
GO

-- ---------------------------------------------------------------------
-- Seeds mínimos (categorias) — evita admin vazio
-- ---------------------------------------------------------------------
INSERT INTO categorias (nome, slug, ativo) VALUES
    (N'Moda feminina', N'moda-feminina', 1),
    (N'Streetwear', N'streetwear', 1),
    (N'Acessórios', N'acessorios', 1),
    (N'Calçados', N'calcados', 1);
GO

-- ---------------------------------------------------------------------
-- Consulta de conferência
-- ---------------------------------------------------------------------


SELECT * FROM usuarios;
