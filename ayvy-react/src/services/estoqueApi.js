/**
 * "Meu estoque" do lojista (tela /meu-estoque).
 * Agora o estoque é por VARIAÇÃO (tamanho + cor) de cada produto: a planilha é montada com
 * GET /produtos/{id}/variacoes de cada produto da loja; editar = PUT /produtos/{id}/variacoes/{variacaoId};
 * desativar/reativar = PATCH .../desativar e .../ativar; peça nova = POST /produtos/{id}/variacoes.
 * As rotas antigas /estoque, /estoque/planilha e /estoque/{id} não existem mais.
 * O relatório de vendas e devoluções por mês continua em GET /estoque/relatorio.
 */
import { apiJson } from "./api";
import { listProdutosDoLojista } from "./lojistaApi";
import {
  ativarVariacao,
  atualizarVariacao,
  criarVariacao,
  desativarVariacao,
  listarVariacoes,
} from "./variacoesApi";

/**
 * Produtos da loja + uma linha por variação (ativas e desativadas):
 * { id, produto, cor, tamanho, quantidade, ativo }.
 */
export async function listarPlanilhaDaLoja(lojistaId) {
  const produtos = (await listProdutosDoLojista(lojistaId)) || [];
  const porProduto = await Promise.all(
    produtos.map((p) =>
      listarVariacoes(p.id)
        .then((vs) => (vs || []).map((v) => ({ ...v, produto: p })))
        .catch(() => []),
    ),
  );
  const linhas = porProduto.flat().map((v) => ({
    id: v.id,
    produto: v.produto,
    cor: v.cor,
    tamanho: v.tamanho,
    quantidade: Number(v.estoque) || 0,
    ativo: v.ativo !== false,
  }));
  return { produtos, linhas };
}

/** Soma peças: se a variação (cor + tamanho) já existe, aumenta o estoque (e reativa); senão cria. */
export async function adicionarPecas({ produtoId, cor, tamanho, quantidade }) {
  const existentes = (await listarVariacoes(produtoId)) || [];
  const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  const atual = existentes.find((v) => igual(v.cor, cor) && igual(v.tamanho, tamanho));
  if (!atual) return criarVariacao(produtoId, { cor, tamanho, estoque: quantidade });
  if (!atual.ativo) await ativarVariacao(produtoId, atual.id);
  return atualizarVariacao(produtoId, atual.id, {
    cor: atual.cor,
    tamanho: atual.tamanho,
    estoque: (Number(atual.estoque) || 0) + quantidade,
  });
}

export function atualizarQuantidade(linha, quantidade) {
  return atualizarVariacao(linha.produto.id, linha.id, {
    cor: linha.cor,
    tamanho: linha.tamanho,
    estoque: quantidade,
  });
}

export function desativarLinha(linha) {
  return desativarVariacao(linha.produto.id, linha.id);
}

export function reativarLinha(linha) {
  return ativarVariacao(linha.produto.id, linha.id);
}

export function relatorioEstoque(lojistaId) {
  return apiJson(`/estoque/relatorio?lojistaId=${encodeURIComponent(lojistaId)}`);
}
