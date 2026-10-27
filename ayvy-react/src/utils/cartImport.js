import { formatBRL } from "./cartHelpers";
import { resolveImageUrl } from "./imageUrl";

const MAX_PARES = 50;
const IMAGEM_PADRAO = "/assets/img/ayvy-media-a.png";
const INTEIRO_POSITIVO = /^\d+$/;

function inteiroPositivo(texto) {
  if (!INTEIRO_POSITIVO.test(texto)) return null;
  const n = Number(texto);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Lê o parâmetro `itens` no formato `produtoId:quantidade,produtoId:quantidade`.
 * Pares inválidos são descartados e ids repetidos têm as quantidades somadas.
 */
export function parseItensParam(valor) {
  const porProduto = new Map();
  let invalidos = 0;

  const pares = String(valor || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_PARES);

  for (const par of pares) {
    const partes = par.split(":");
    const produtoId = partes.length === 2 ? inteiroPositivo(partes[0].trim()) : null;
    const quantidade = partes.length === 2 ? inteiroPositivo(partes[1].trim()) : null;
    if (produtoId == null || quantidade == null) {
      invalidos += 1;
      continue;
    }
    porProduto.set(produtoId, (porProduto.get(produtoId) || 0) + quantidade);
  }

  return {
    itens: [...porProduto].map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
    invalidos,
  };
}

function slugDaLoja(lojista) {
  return String(lojista?.slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function listaLimpa(lista) {
  return Array.isArray(lista) ? lista.map((v) => String(v).trim()).filter(Boolean) : [];
}

/**
 * Cruza os itens do link com os produtos reais da API e o carrinho atual.
 * Preço, nome, imagem e estoque vêm sempre da API.
 */
export function montarImportacao(itens, produtosApi, carrinhoAtual) {
  const porId = new Map((produtosApi || []).map((p) => [Number(p.id), p]));
  const linhas = [];
  const avisos = [];
  let adicionados = 0;

  for (const { produtoId, quantidade } of itens) {
    const p = porId.get(produtoId);
    if (!p) {
      avisos.push(`Um produto do app (código ${produtoId}) não foi encontrado e não foi adicionado.`);
      continue;
    }
    const nome = p.nome || `Produto ${produtoId}`;
    if (String(p.status || "").toLowerCase() !== "ativo") {
      avisos.push(`O produto ${nome} não está mais disponível e não foi adicionado.`);
      continue;
    }
    const estoque = Math.max(0, Number(p.estoque) || 0);
    if (estoque === 0) {
      avisos.push(`O produto ${nome} está esgotado e não foi adicionado.`);
      continue;
    }

    const noCarrinho = (carrinhoAtual || [])
      .filter((l) => Number(l.apiId ?? l.productId) === produtoId)
      .reduce((soma, l) => soma + (l.quantity || 1), 0);
    const disponivel = estoque - noCarrinho;
    if (disponivel <= 0) {
      avisos.push(
        `O produto ${nome} já está no seu carrinho com a quantidade máxima em estoque (${estoque}).`,
      );
      continue;
    }

    const qtd = Math.min(quantidade, disponivel);
    if (qtd < quantidade) {
      avisos.push(
        noCarrinho > 0
          ? `O produto ${nome} tem só ${estoque} em estoque e você já tinha ${noCarrinho} no carrinho: adicionamos ${qtd}.`
          : `O produto ${nome} tem só ${estoque} em estoque: adicionamos ${qtd} em vez de ${quantidade}.`,
      );
    }

    const cores = listaLimpa(p.cores);
    const tamanhos = listaLimpa(p.tamanhos);
    linhas.push({
      name: nome,
      image: resolveImageUrl(p.imagemPrincipalUrl) || IMAGEM_PADRAO,
      price: formatBRL(Number(p.preco) || 0),
      quantity: qtd,
      productId: String(p.id),
      apiId: p.id,
      shopSlug: slugDaLoja(p.lojista),
      shopName: p.lojista?.nomeLoja || "",
      stock: estoque,
      colors: cores,
      sizes: tamanhos,
      color: cores.length === 1 ? cores[0] : null,
      size: tamanhos.length === 1 ? tamanhos[0] : null,
    });
    adicionados += qtd;
  }

  return { linhas, avisos, adicionados };
}

/** Linha importada que ainda precisa que o cliente escolha cor e/ou tamanho. */
export function linhaPrecisaOpcoes(line) {
  return (
    (Array.isArray(line?.colors) && line.colors.length > 0 && !line.color) ||
    (Array.isArray(line?.sizes) && line.sizes.length > 0 && !line.size)
  );
}
