/* =============================================================================
   AYVY — Schema SQL Server (SSMS Compatível)
   Conversão direta do schema MySQL para T-SQL
   Sem alterar estrutura, tabelas ou relacionamentos
============================================================================= */

IF DB_ID('ayvy') IS NOT NULL
BEGIN
    ALTER DATABASE ayvy SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ayvy;
END;
GO

CREATE DATABASE ayvy;
GO

USE ayvy;
GO

/* =============================================================================
   CAMADA 1 — IDENTIDADE
============================================================================= */

CREATE TABLE usuarios (
    id INT IDENTITY(1,1) NOT NULL,

    papel VARCHAR(20) NOT NULL
        CHECK (papel IN ('admin', 'cliente', 'lojista')),

    nome VARCHAR(120) NOT NULL,

    email VARCHAR(191) NOT NULL,

    senha_hash VARCHAR(255) NOT NULL,

    telefone VARCHAR(20) NULL,

    avatar_url VARCHAR(500) NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'inativo', 'bloqueado')),

    ultimo_login_em DATETIME2 NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    atualizado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_usuarios PRIMARY KEY (id),

    CONSTRAINT UK_usuarios_email UNIQUE (email)
);
GO

CREATE INDEX idx_usuarios_papel ON usuarios(papel);
GO

CREATE INDEX idx_usuarios_status ON usuarios(status);
GO

/* =============================================================================
   CAMADA 2 — PERFIS
============================================================================= */

CREATE TABLE clientes (
    id INT IDENTITY(1,1) NOT NULL,

    usuario_id INT NOT NULL,

    cpf CHAR(11) NOT NULL,

    data_nascimento DATE NULL,

    CONSTRAINT PK_clientes PRIMARY KEY (id),

    CONSTRAINT UK_clientes_usuario UNIQUE (usuario_id),

    CONSTRAINT UK_clientes_cpf UNIQUE (cpf),

    CONSTRAINT FK_clientes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
GO

CREATE TABLE lojistas (
    id INT IDENTITY(1,1) NOT NULL,

    usuario_id INT NOT NULL,

    nome_loja VARCHAR(150) NOT NULL,

    slug VARCHAR(100) NOT NULL,

    cnpj CHAR(14) NOT NULL,

    banner_url VARCHAR(500) NULL,

    logo_url VARCHAR(500) NULL,

    descricao NVARCHAR(MAX) NULL,

    status_loja VARCHAR(20) NOT NULL
        DEFAULT 'aprovado'
        CHECK (status_loja IN ('pendente', 'aprovado', 'rejeitado', 'suspenso')),

    aprovado_em DATETIME2 NULL,

    CONSTRAINT PK_lojistas PRIMARY KEY (id),

    CONSTRAINT UK_lojistas_usuario UNIQUE (usuario_id),

    CONSTRAINT UK_lojistas_cnpj UNIQUE (cnpj),

    CONSTRAINT UK_lojistas_slug UNIQUE (slug),

    CONSTRAINT FK_lojistas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_lojistas_status
ON lojistas(status_loja);
GO

/* =============================================================================
   CAMADA 3 — ENDEREÇOS
============================================================================= */

CREATE TABLE enderecos (
    id INT IDENTITY(1,1) NOT NULL,

    usuario_id INT NOT NULL,

    apelido VARCHAR(60) NULL,

    logradouro VARCHAR(200) NOT NULL,

    numero VARCHAR(20) NOT NULL,

    complemento VARCHAR(100) NULL,

    bairro VARCHAR(100) NOT NULL,

    cidade VARCHAR(100) NOT NULL,

    uf CHAR(2) NOT NULL,

    cep CHAR(8) NOT NULL,

    principal BIT NOT NULL DEFAULT 0,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_enderecos PRIMARY KEY (id),

    CONSTRAINT FK_enderecos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_enderecos_usuario
ON enderecos(usuario_id);
GO

CREATE INDEX idx_enderecos_cep
ON enderecos(cep);
GO

/* =============================================================================
   CAMADA 4 — CATÁLOGO
============================================================================= */

CREATE TABLE categorias (
    id INT IDENTITY(1,1) NOT NULL,

    nome VARCHAR(100) NOT NULL,

    slug VARCHAR(100) NOT NULL,

    ativo BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_categorias PRIMARY KEY (id),

    CONSTRAINT UK_categorias_slug UNIQUE (slug)
);
GO

CREATE TABLE produtos (
    id INT IDENTITY(1,1) NOT NULL,

    lojista_id INT NOT NULL,

    categoria_id INT NULL,

    nome VARCHAR(200) NOT NULL,

    slug VARCHAR(150) NOT NULL,

    descricao NVARCHAR(MAX) NULL,

    preco DECIMAL(12,2) NOT NULL,

    estoque INT NOT NULL DEFAULT 0,

    imagem_principal_url VARCHAR(500) NULL,

    visualizacoes_total INT NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL
        DEFAULT 'rascunho'
        CHECK (status IN ('rascunho', 'ativo', 'inativo', 'esgotado')),

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    atualizado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_produtos PRIMARY KEY (id),

    CONSTRAINT UK_produtos_lojista_slug
        UNIQUE (lojista_id, slug),

    CONSTRAINT FK_produtos_lojista
        FOREIGN KEY (lojista_id)
        REFERENCES lojistas(id),

    CONSTRAINT FK_produtos_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL,

    CONSTRAINT CHK_produtos_preco
        CHECK (preco >= 0)
);
GO

CREATE INDEX idx_produtos_lojista
ON produtos(lojista_id);
GO

CREATE INDEX idx_produtos_categoria
ON produtos(categoria_id);
GO

CREATE INDEX idx_produtos_status
ON produtos(status);
GO

CREATE TABLE produto_imagens (
    id INT IDENTITY(1,1) NOT NULL,

    produto_id INT NOT NULL,

    url VARCHAR(500) NOT NULL,

    ordem SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT PK_produto_imagens PRIMARY KEY (id),

    CONSTRAINT FK_produto_imagens_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_produto_imagens_produto
ON produto_imagens(produto_id);
GO

/* =============================================================================
   CAMADA 5 — ENGAJAMENTO
============================================================================= */

CREATE TABLE favoritos (
    id INT IDENTITY(1,1) NOT NULL,

    cliente_id INT NOT NULL,

    produto_id INT NOT NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_favoritos PRIMARY KEY (id),

    CONSTRAINT UK_favoritos_cliente_produto
        UNIQUE (cliente_id, produto_id),

    CONSTRAINT FK_favoritos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_favoritos_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_favoritos_cliente
ON favoritos(cliente_id);
GO

CREATE INDEX idx_favoritos_produto
ON favoritos(produto_id);
GO

CREATE TABLE visualizacoes_produtos (
    id BIGINT IDENTITY(1,1) NOT NULL,

    produto_id INT NOT NULL,

    usuario_id INT NULL,

    ip_hash CHAR(64) NULL,

    user_agent VARCHAR(255) NULL,

    visualizado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_visualizacoes_produtos PRIMARY KEY (id),

    CONSTRAINT FK_vis_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_vis_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);
GO

CREATE INDEX idx_vis_produto
ON visualizacoes_produtos(produto_id);
GO

CREATE INDEX idx_vis_usuario
ON visualizacoes_produtos(usuario_id);
GO

CREATE INDEX idx_vis_data
ON visualizacoes_produtos(visualizado_em);
GO

CREATE INDEX idx_vis_produto_data
ON visualizacoes_produtos(produto_id, visualizado_em);
GO

/* =============================================================================
   CAMADA 6 — PEDIDOS
============================================================================= */

CREATE TABLE pedidos (
    id INT IDENTITY(1,1) NOT NULL,

    cliente_id INT NOT NULL,

    status VARCHAR(30) NOT NULL
        DEFAULT 'aguardando_pagamento'
        CHECK (
            status IN (
                'aguardando_pagamento',
                'pago',
                'em_separacao',
                'enviado',
                'entregue',
                'cancelado',
                'reembolsado'
            )
        ),

    valor_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    valor_frete DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    observacao VARCHAR(500) NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    atualizado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_pedidos PRIMARY KEY (id),

    CONSTRAINT FK_pedidos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
);
GO

CREATE INDEX idx_pedidos_cliente
ON pedidos(cliente_id);
GO

CREATE INDEX idx_pedidos_status
ON pedidos(status);
GO

CREATE INDEX idx_pedidos_criado
ON pedidos(criado_em);
GO

CREATE TABLE pedido_endereco_entrega (
    pedido_id INT NOT NULL,

    logradouro VARCHAR(200) NOT NULL,

    numero VARCHAR(20) NOT NULL,

    complemento VARCHAR(100) NULL,

    bairro VARCHAR(100) NOT NULL,

    cidade VARCHAR(100) NOT NULL,

    uf CHAR(2) NOT NULL,

    cep CHAR(8) NOT NULL,

    CONSTRAINT PK_pedido_endereco_entrega
        PRIMARY KEY (pedido_id),

    CONSTRAINT FK_pedido_endereco_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);
GO

CREATE TABLE pedido_produtos (
    id INT IDENTITY(1,1) NOT NULL,

    pedido_id INT NOT NULL,

    produto_id INT NOT NULL,

    lojista_id INT NOT NULL,

    quantidade INT NOT NULL DEFAULT 1,

    preco_unitario DECIMAL(12,2) NOT NULL,

    CONSTRAINT PK_pedido_produtos PRIMARY KEY (id),

    CONSTRAINT FK_pp_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_pp_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id),

    CONSTRAINT FK_pp_lojista
        FOREIGN KEY (lojista_id)
        REFERENCES lojistas(id),

    CONSTRAINT CHK_pp_qtd
        CHECK (quantidade > 0),

    CONSTRAINT CHK_pp_preco
        CHECK (preco_unitario >= 0)
);
GO

CREATE INDEX idx_pedido_produtos_pedido
ON pedido_produtos(pedido_id);
GO

CREATE INDEX idx_pedido_produtos_lojista
ON pedido_produtos(lojista_id);
GO

CREATE TABLE pagamentos (
    id INT IDENTITY(1,1) NOT NULL,

    pedido_id INT NOT NULL,

    valor DECIMAL(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'pendente'
        CHECK (
            status IN (
                'pendente',
                'aprovado',
                'recusado',
                'estornado'
            )
        ),

    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'pix',
                'cartao_credito',
                'cartao_debito',
                'boleto'
            )
        ),

    referencia VARCHAR(191) NULL,

    pago_em DATETIME2 NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_pagamentos PRIMARY KEY (id),

    CONSTRAINT FK_pagamentos_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_pagamentos_pedido
ON pagamentos(pedido_id);
GO

/* =============================================================================
   CAMADA 7 — HISTÓRICO
============================================================================= */

CREATE TABLE historico_compras (
    id INT IDENTITY(1,1) NOT NULL,

    pedido_id INT NOT NULL,

    evento VARCHAR(80) NOT NULL,

    status_pedido VARCHAR(50) NULL,

    descricao VARCHAR(500) NULL,

    actor_usuario_id INT NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_historico_compras PRIMARY KEY (id),

    CONSTRAINT FK_hist_compras_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_hist_compras_actor
        FOREIGN KEY (actor_usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);
GO

CREATE INDEX idx_hist_compras_pedido
ON historico_compras(pedido_id);
GO

CREATE INDEX idx_hist_compras_criado
ON historico_compras(criado_em);
GO

CREATE TABLE historico_cadastro_lojista (
    id INT IDENTITY(1,1) NOT NULL,

    lojista_id INT NOT NULL,

    admin_usuario_id INT NULL,

    status_anterior VARCHAR(30) NULL,

    status_novo VARCHAR(30) NOT NULL,

    observacao NVARCHAR(MAX) NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_hist_loj PRIMARY KEY (id),

    CONSTRAINT FK_hist_loj_lojista
        FOREIGN KEY (lojista_id)
        REFERENCES lojistas(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_hist_loj_admin
        FOREIGN KEY (admin_usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);
GO

CREATE INDEX idx_hist_loj_lojista
ON historico_cadastro_lojista(lojista_id);
GO

CREATE TABLE notificacoes (
    id INT IDENTITY(1,1) NOT NULL,

    usuario_id INT NOT NULL,

    titulo VARCHAR(150) NOT NULL,

    mensagem NVARCHAR(MAX) NOT NULL,

    tipo VARCHAR(20) NOT NULL
        DEFAULT 'info'
        CHECK (
            tipo IN (
                'info',
                'sucesso',
                'alerta',
                'pedido',
                'loja'
            )
        ),

    lida BIT NOT NULL DEFAULT 0,

    lida_em DATETIME2 NULL,

    criado_em DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT PK_notificacoes PRIMARY KEY (id),

    CONSTRAINT FK_notificacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_notif_usuario
ON notificacoes(usuario_id, lida);
GO

CREATE TABLE mensagens (
    id INT IDENTITY(1,1) NOT NULL,

    nome VARCHAR(120) NOT NULL,

    texto NVARCHAR(MAX) NOT NULL,

    data_envio DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    data_recebimento DATETIME2 NULL,

    data_editado DATETIME2 NULL,

    CONSTRAINT PK_mensagens PRIMARY KEY (id)
);
GO

/* =============================================================================
   VIEWS
============================================================================= */

CREATE VIEW vw_usuarios_completo
AS
SELECT
    u.id,
    u.papel,
    u.nome,
    u.email,
    u.telefone,
    u.avatar_url,
    u.status,
    u.ultimo_login_em,
    u.criado_em,

    c.id AS cliente_id,
    c.cpf,
    c.data_nascimento,

    l.id AS lojista_id,
    l.nome_loja,
    l.slug AS loja_slug,
    l.cnpj,
    l.logo_url,
    l.banner_url,
    l.status_loja

FROM usuarios u
LEFT JOIN clientes c
    ON c.usuario_id = u.id
LEFT JOIN lojistas l
    ON l.usuario_id = u.id;
GO

CREATE VIEW vw_pedidos_resumo
AS
SELECT
    p.id AS pedido_id,
    p.cliente_id,
    u.nome AS cliente_nome,
    u.email AS cliente_email,
    p.status,
    p.valor_total,
    p.criado_em,

    (
        SELECT COUNT(*)
        FROM pedido_produtos pp
        WHERE pp.pedido_id = p.id
    ) AS qtd_itens

FROM pedidos p
INNER JOIN clientes c
    ON c.id = p.cliente_id
INNER JOIN usuarios u
    ON u.id = c.usuario_id;
GO

/* =============================================================================
   TRIGGERS
============================================================================= */

CREATE TRIGGER trg_visualizacao_incrementa_contador
ON visualizacoes_produtos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE p
    SET visualizacoes_total = visualizacoes_total + 1
    FROM produtos p
    INNER JOIN inserted i
        ON p.id = i.produto_id;
END;
GO

/* =============================================================================
   UPDATED_AT TRIGGERS
============================================================================= */

CREATE TRIGGER trg_usuarios_updated_at
ON usuarios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE usuarios
    SET atualizado_em = SYSDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

CREATE TRIGGER trg_produtos_updated_at
ON produtos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE produtos
    SET atualizado_em = SYSDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

CREATE TRIGGER trg_pedidos_updated_at
ON pedidos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE pedidos
    SET atualizado_em = SYSDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

/* =============================================================================
   SEEDS
============================================================================= */

INSERT INTO categorias (nome, slug)
VALUES
('Moda feminina', 'moda-feminina'),
('Streetwear', 'streetwear'),
('Acessórios', 'acessorios'),
('Calçados', 'calcados');
GO

INSERT INTO usuarios (
    papel,
    nome,
    email,
    senha_hash,
    status
)
VALUES (
    'admin',
    'Administrador AYVY',
    'admin@ayvy.com.br',
    '$2b$10$PLACEHOLDER_TROCAR_NO_BACKEND',
    'ativo'
);
GO

select * from usuarios;