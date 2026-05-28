-- =============================================================================
-- AYVY — Schema MySQL 8+ | Modelo centralizado em `usuarios`
-- =============================================================================
--
-- PRINCÍPIOS:
--   1. `usuarios` = única fonte de login, contato comum (telefone, avatar) e auditoria.
--   2. Perfis 1:1 (`clientes`, `lojistas`) = apenas campos que NÃO existem em `usuarios`.
--   3. Demais tabelas referenciam o perfil de negócio (cliente_id / lojista_id) ou usuario_id.
--   4. Sem FKs redundantes deriváveis (ex.: lojista_id em favoritos se já há produto_id).
--   5. Snapshots em pedido (endereço e preço) para histórico imutável.
--
-- Execução: docker exec -i ayvy_mysql mysql -uroot -proot < database/ayvy_schema.sql
-- =============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS ayvy;
CREATE DATABASE ayvy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ayvy;

-- =============================================================================
-- CAMADA 1 — IDENTIDADE (login + papel fixo)
-- =============================================================================

CREATE TABLE usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  papel           ENUM('admin', 'cliente', 'lojista') NOT NULL,
  nome            VARCHAR(120) NOT NULL COMMENT 'Nome da pessoa (responsável / comprador)',
  email           VARCHAR(191) NOT NULL,
  senha_hash      VARCHAR(255) NOT NULL,
  telefone        VARCHAR(20) NULL COMMENT 'Contato — não duplicar em perfis',
  avatar_url      VARCHAR(500) NULL COMMENT 'Foto de perfil — não duplicar em clientes',
  status          ENUM('ativo', 'inativo', 'bloqueado') NOT NULL DEFAULT 'ativo',
  ultimo_login_em DATETIME NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email),
  KEY idx_usuarios_papel (papel),
  KEY idx_usuarios_status (status)
) ENGINE=InnoDB COMMENT='Identidade central (login)';

-- =============================================================================
-- CAMADA 2 — PERFIS 1:1 (somente campos específicos do tipo)
-- =============================================================================

-- Cliente: apenas identificação fiscal e dados de comprador.
CREATE TABLE clientes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  cpf             CHAR(11) NOT NULL,
  data_nascimento DATE NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_clientes_usuario (usuario_id),
  UNIQUE KEY uk_clientes_cpf (cpf),
  CONSTRAINT fk_clientes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Perfil cliente (1:1 usuario) — sem email/senha/telefone/foto';

-- Lojista: dados da LOJA (nome da pessoa fica em usuarios.nome).
CREATE TABLE lojistas (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  nome_loja       VARCHAR(150) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  cnpj            CHAR(14) NOT NULL,
  banner_url      VARCHAR(500) NULL,
  logo_url        VARCHAR(500) NULL COMMENT 'Logo da loja (avatar da vitrine)',
  descricao       TEXT NULL,
  status_loja     ENUM('pendente', 'aprovado', 'rejeitado', 'suspenso') NOT NULL DEFAULT 'aprovado',
  aprovado_em     DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lojistas_usuario (usuario_id),
  UNIQUE KEY uk_lojistas_cnpj (cnpj),
  UNIQUE KEY uk_lojistas_slug (slug),
  KEY idx_lojistas_status (status_loja),
  CONSTRAINT fk_lojistas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Perfil lojista (1:1 usuario) — sem telefone duplicado';

-- =============================================================================
-- CAMADA 3 — ENDEREÇOS (vinculados ao usuario, não ao perfil duplicado)
-- =============================================================================

CREATE TABLE enderecos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL COMMENT 'Dono do endereço (cliente ou lojista)',
  apelido         VARCHAR(60) NULL,
  logradouro      VARCHAR(200) NOT NULL,
  numero          VARCHAR(20) NOT NULL,
  complemento     VARCHAR(100) NULL,
  bairro          VARCHAR(100) NOT NULL,
  cidade          VARCHAR(100) NOT NULL,
  uf              CHAR(2) NOT NULL,
  cep             CHAR(8) NOT NULL,
  principal       TINYINT(1) NOT NULL DEFAULT 0,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_enderecos_usuario (usuario_id),
  KEY idx_enderecos_cep (cep),
  CONSTRAINT fk_enderecos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Endereços por usuario (evita cliente_id + lojista_id duplicados)';

-- =============================================================================
-- CAMADA 4 — CATÁLOGO
-- =============================================================================

CREATE TABLE categorias (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome    VARCHAR(100) NOT NULL,
  slug    VARCHAR(100) NOT NULL,
  ativo   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categorias_slug (slug)
) ENGINE=InnoDB COMMENT='Categorias de produto';

CREATE TABLE produtos (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lojista_id            INT UNSIGNED NOT NULL,
  categoria_id          INT UNSIGNED NULL,
  nome                  VARCHAR(200) NOT NULL,
  slug                  VARCHAR(150) NOT NULL,
  descricao             TEXT NULL,
  preco                 DECIMAL(12, 2) NOT NULL,
  estoque               INT UNSIGNED NOT NULL DEFAULT 0,
  imagem_principal_url  VARCHAR(500) NULL,
  visualizacoes_total   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cache; fonte: visualizacoes_produtos',
  status                ENUM('rascunho', 'ativo', 'inativo', 'esgotado') NOT NULL DEFAULT 'rascunho',
  criado_em             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_produtos_lojista_slug (lojista_id, slug),
  KEY idx_produtos_lojista (lojista_id),
  KEY idx_produtos_categoria (categoria_id),
  KEY idx_produtos_status (status),
  FULLTEXT KEY ft_produtos_busca (nome, descricao),
  CONSTRAINT fk_produtos_lojista
    FOREIGN KEY (lojista_id) REFERENCES lojistas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_produtos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_produtos_preco CHECK (preco >= 0)
) ENGINE=InnoDB COMMENT='Produtos';

CREATE TABLE produto_imagens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id  INT UNSIGNED NOT NULL,
  url         VARCHAR(500) NOT NULL,
  ordem       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_produto_imagens_produto (produto_id),
  CONSTRAINT fk_produto_imagens_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Galeria do produto';

-- =============================================================================
-- CAMADA 5 — ENGAJAMENTO (sem redundância)
-- =============================================================================

-- Apenas cliente + produto (lojista obtém-se via JOIN produtos.lojista_id).
CREATE TABLE favoritos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id  INT UNSIGNED NOT NULL,
  produto_id  INT UNSIGNED NOT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_favoritos_cliente_produto (cliente_id, produto_id),
  KEY idx_favoritos_cliente (cliente_id),
  KEY idx_favoritos_produto (produto_id),
  CONSTRAINT fk_favoritos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_favoritos_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Favoritos (sem lojista_id redundante)';

CREATE TABLE visualizacoes_produtos (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id      INT UNSIGNED NOT NULL,
  usuario_id      INT UNSIGNED NULL COMMENT 'Visitante logado (qualquer papel)',
  ip_hash         CHAR(64) NULL,
  user_agent      VARCHAR(255) NULL,
  visualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vis_produto (produto_id),
  KEY idx_vis_usuario (usuario_id),
  KEY idx_vis_data (visualizado_em),
  KEY idx_vis_produto_data (produto_id, visualizado_em),
  CONSTRAINT fk_vis_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_vis_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Métricas (sem cliente_id/lojista_id redundantes)';

-- =============================================================================
-- CAMADA 6 — PEDIDOS E PAGAMENTOS
-- =============================================================================

CREATE TABLE pedidos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id      INT UNSIGNED NOT NULL,
  status          ENUM(
    'aguardando_pagamento', 'pago', 'em_separacao',
    'enviado', 'entregue', 'cancelado', 'reembolsado'
  ) NOT NULL DEFAULT 'aguardando_pagamento',
  valor_subtotal  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  valor_frete     DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  valor_total     DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  observacao      VARCHAR(500) NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pedidos_cliente (cliente_id),
  KEY idx_pedidos_status (status),
  KEY idx_pedidos_criado (criado_em),
  CONSTRAINT fk_pedidos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Cabeçalho do pedido';

-- Snapshot do endereço no momento da compra (não FK para enderecos mutáveis).
CREATE TABLE pedido_endereco_entrega (
  pedido_id     INT UNSIGNED NOT NULL,
  logradouro    VARCHAR(200) NOT NULL,
  numero        VARCHAR(20) NOT NULL,
  complemento   VARCHAR(100) NULL,
  bairro        VARCHAR(100) NOT NULL,
  cidade        VARCHAR(100) NOT NULL,
  uf            CHAR(2) NOT NULL,
  cep           CHAR(8) NOT NULL,
  PRIMARY KEY (pedido_id),
  CONSTRAINT fk_pedido_endereco_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Endereço congelado na compra';

CREATE TABLE pedido_produtos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED NOT NULL,
  produto_id      INT UNSIGNED NOT NULL,
  lojista_id      INT UNSIGNED NOT NULL COMMENT 'Snapshot: loja no momento da venda',
  quantidade      INT UNSIGNED NOT NULL DEFAULT 1,
  preco_unitario  DECIMAL(12, 2) NOT NULL COMMENT 'Snapshot: preço na venda',
  PRIMARY KEY (id),
  KEY idx_pedido_produtos_pedido (pedido_id),
  KEY idx_pedido_produtos_lojista (lojista_id),
  CONSTRAINT fk_pp_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pp_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pp_lojista
    FOREIGN KEY (lojista_id) REFERENCES lojistas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_pp_qtd CHECK (quantidade > 0),
  CONSTRAINT chk_pp_preco CHECK (preco_unitario >= 0)
) ENGINE=InnoDB COMMENT='Itens do pedido (subtotal = quantidade * preco_unitario)';

CREATE TABLE pagamentos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id   INT UNSIGNED NOT NULL,
  valor       DECIMAL(12, 2) NOT NULL,
  status      ENUM('pendente', 'aprovado', 'recusado', 'estornado') NOT NULL DEFAULT 'pendente',
  tipo        ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto') NOT NULL,
  referencia  VARCHAR(191) NULL,
  pago_em     DATETIME NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagamentos_pedido (pedido_id),
  CONSTRAINT fk_pagamentos_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Pagamentos do pedido';

-- =============================================================================
-- CAMADA 7 — HISTÓRICO E NOTIFICAÇÕES
-- =============================================================================

-- Eventos do pedido (sem cliente_id redundante — vem de pedidos.cliente_id).
CREATE TABLE historico_compras (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED NOT NULL,
  evento          VARCHAR(80) NOT NULL,
  status_pedido   VARCHAR(50) NULL,
  descricao       VARCHAR(500) NULL,
  actor_usuario_id INT UNSIGNED NULL COMMENT 'Quem disparou (admin/sistema/cliente)',
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_compras_pedido (pedido_id),
  KEY idx_hist_compras_criado (criado_em),
  CONSTRAINT fk_hist_compras_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_compras_actor
    FOREIGN KEY (actor_usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Auditoria de pedidos';

CREATE TABLE historico_cadastro_lojista (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lojista_id        INT UNSIGNED NOT NULL,
  admin_usuario_id  INT UNSIGNED NULL,
  status_anterior   VARCHAR(30) NULL,
  status_novo       VARCHAR(30) NOT NULL,
  observacao        TEXT NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_loj_lojista (lojista_id),
  CONSTRAINT fk_hist_loj_lojista
    FOREIGN KEY (lojista_id) REFERENCES lojistas (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_loj_admin
    FOREIGN KEY (admin_usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Aprovação de lojistas';

CREATE TABLE notificacoes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  mensagem    TEXT NOT NULL,
  tipo        ENUM('info', 'sucesso', 'alerta', 'pedido', 'loja') NOT NULL DEFAULT 'info',
  lida        TINYINT(1) NOT NULL DEFAULT 0,
  lida_em     DATETIME NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_usuario (usuario_id, lida),
  CONSTRAINT fk_notificacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Notificações';

-- Mensagens (API legada / contato)
CREATE TABLE mensagens (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome              VARCHAR(120) NOT NULL,
  texto             TEXT NOT NULL,
  data_envio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_recebimento  DATETIME NULL,
  data_editado      DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Mensagens de contato';

-- =============================================================================
-- VIEWS — consultas prontas para o backend (JOIN centralizado)
-- =============================================================================

CREATE VIEW vw_usuarios_completo AS
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
LEFT JOIN clientes c ON c.usuario_id = u.id
LEFT JOIN lojistas l ON l.usuario_id = u.id;

CREATE VIEW vw_pedidos_resumo AS
SELECT
  p.id AS pedido_id,
  p.cliente_id,
  u.nome AS cliente_nome,
  u.email AS cliente_email,
  p.status,
  p.valor_total,
  p.criado_em,
  (SELECT COUNT(*) FROM pedido_produtos pp WHERE pp.pedido_id = p.id) AS qtd_itens
FROM pedidos p
INNER JOIN clientes c ON c.id = p.cliente_id
INNER JOIN usuarios u ON u.id = c.usuario_id;

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DELIMITER $$

CREATE TRIGGER trg_visualizacao_incrementa_contador
AFTER INSERT ON visualizacoes_produtos
FOR EACH ROW
BEGIN
  UPDATE produtos SET visualizacoes_total = visualizacoes_total + 1 WHERE id = NEW.produto_id;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEEDS
-- =============================================================================
INSERT INTO categorias (nome, slug) VALUES
  ('Moda feminina', 'moda-feminina'),
  ('Streetwear', 'streetwear'),
  ('Acessórios', 'acessorios'),
  ('Calçados', 'calcados');

INSERT INTO usuarios (papel, nome, email, senha_hash, status) VALUES
  ('admin', 'Administrador AYVY', 'admin@ayvy.com.br', '$2b$10$PLACEHOLDER_TROCAR_NO_BACKEND', 'ativo');
