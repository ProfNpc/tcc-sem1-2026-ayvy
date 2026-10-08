import {
  addProdutoImagem,
  createProduto,
  deleteProduto,
  deleteProdutoImagem,
  getProduto,
  listCategorias,
  listProdutoImagens,
  listProdutos,
  updateProduto,
  uploadImage,
} from "./adminApi";
import {
  atualizarStatusPedido,
  confirmarRecebimentoPedido,
  getPedidoEndereco,
  getPedidoItens,
  listPagamentos,
  listTodosPedidos,
  registrarEnvioPedido,
} from "./pedidosApi";
import { resolveImageUrl } from "../utils/imageUrl";
import { numeroPedidoLabel } from "../utils/pedidoNumero";
import { formatBRL } from "../utils/cartHelpers";

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePrice(raw) {
  const n = Number(String(raw || "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function formatEndereco(e) {
  if (!e) return "—";
  const parts = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join(" — "),
    e.cep ? `CEP ${e.cep}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function formatPagamentoTipo(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t === "pix") return "pix";
  if (t === "cartao_credito" || t === "credito") return "cartao_credito";
  if (t === "cartao_debito" || t === "debito") return "cartao_debito";
  return t || "—";
}

export { listCategorias };

/**
 * Lista produtos da loja do lojista logado.
 * @param {number} lojistaId
 * @param {"ativo"|"rascunho"|"all"} [statusFilter]
 */
export async function listProdutosDoLojista(lojistaId, statusFilter = "all") {
  const all = await listProdutos();
  return (all || []).filter((p) => {
    if (p?.lojista?.id !== lojistaId) return false;
    const st = String(p.status || p.statusProduto || "").toLowerCase();
    if (statusFilter === "all") return true;
    return st === statusFilter;
  });
}

export function mapApiProdutoToCard(p) {
  const img = resolveImageUrl(p.imagemPrincipalUrl) || "";
  const priceNum = Number(p.preco) || 0;
  return {
    id: String(p.id),
    apiId: p.id,
    title: p.nome,
    name: p.nome,
    price: formatBRL(priceNum),
    href: img,
    img,
    images: img ? [img] : [],
    description: p.descricao || "",
    stock: (p.estoque ?? 0) > 0 ? "disponivel" : "indisponivel",
    slug: p.slug,
    status: String(p.status || "").toLowerCase(),
    ...(Array.isArray(p.cores) ? { colors: p.cores } : {}),
    ...(Array.isArray(p.tamanhos) ? { sizes: p.tamanhos } : {}),
  };
}

function cleanList(list) {
  return [...new Set((list || []).map((v) => String(v).trim()).filter(Boolean))];
}

async function uploadFotos(images) {
  const urls = [];
  for (const item of images || []) {
    if (item.file) {
      const up = await uploadImage(item.file, "produtos");
      const caminho = up?.caminho || up?.url || "";
      if (caminho) urls.push(caminho);
    } else if (item.caminho) {
      urls.push(item.caminho);
    }
  }
  return urls;
}

/**
 * Cria produto (rascunho ou ativo) com fotos.
 */
export async function salvarProdutoLojista({
  lojistaId,
  form,
  images,
  status = "ativo",
  categoriaId,
}) {
  if (!lojistaId) throw new Error("Lojista não identificado na sessão.");
  const nome = String(form.title || form.nome || "").trim();
  if (!nome) throw new Error("Informe o nome do produto.");
  const preco = parsePrice(form.price ?? form.preco);
  if (!Number.isFinite(preco) || preco < 0) throw new Error("Informe um preço válido.");

  const caminhos = await uploadFotos(images);
  const slugBase = slugify(nome) || `produto-${Date.now()}`;
  const payload = {
    nome,
    slug: `${slugBase}-${Date.now().toString(36)}`,
    descricao: String(form.description || form.descricao || "").trim() || null,
    preco,
    estoque: Number(form.stock ?? form.estoque) || 0,
    imagemPrincipalUrl: caminhos[0] || null,
    cores: cleanList(form.colors),
    tamanhos: cleanList(form.sizes),
    status,
    lojista: { id: Number(lojistaId) },
  };
  if (categoriaId) payload.categoria = { id: Number(categoriaId) };

  const created = await createProduto(payload);
  for (let i = 0; i < caminhos.length; i++) {
    try {
      await addProdutoImagem(created.id, { caminho: caminhos[i], ordem: i });
    } catch {
      /* principal já salvo */
    }
  }
  return created;
}

/**
 * Carrega produto + galeria para o formulário de edição do lojista.
 * Imagens existentes vêm com `caminho` (e `imagemId` quando estão na galeria).
 */
export async function carregarProdutoParaEdicao(produtoId) {
  const [produto, galeria] = await Promise.all([
    getProduto(produtoId),
    listProdutoImagens(produtoId).catch(() => []),
  ]);

  let images = (galeria || []).map((img) => ({
    id: `img-${img.id}`,
    imagemId: img.id,
    caminho: img.caminho,
    preview: resolveImageUrl(img.caminho),
  }));
  if (images.length === 0 && produto.imagemPrincipalUrl) {
    images = [
      {
        id: "principal",
        caminho: produto.imagemPrincipalUrl,
        preview: resolveImageUrl(produto.imagemPrincipalUrl),
      },
    ];
  }

  const preco = Number(produto.preco);
  return {
    produto,
    images,
    form: {
      title: produto.nome || "",
      description: produto.descricao || "",
      categoryId: produto.categoria?.id ? String(produto.categoria.id) : "",
      price: Number.isFinite(preco) ? preco.toFixed(2).replace(".", ",") : "",
      discountPercent: "",
      stock: produto.estoque != null ? String(produto.estoque) : "",
      sku: "",
      colors: Array.isArray(produto.cores) ? produto.cores : [],
      sizes: Array.isArray(produto.tamanhos) ? produto.tamanhos : [],
    },
  };
}

/**
 * Salva a edição: dados, cores/tamanhos e fotos (remove as tiradas, envia as novas).
 */
export async function atualizarProdutoLojista({
  produtoId,
  form,
  images,
  originalImages,
  categoriaId,
}) {
  const nome = String(form.title || "").trim();
  if (!nome) throw new Error("Informe o nome do produto.");
  const preco = parsePrice(form.price);
  if (!Number.isFinite(preco) || preco < 0) throw new Error("Informe um preço válido.");
  if (!images?.length) throw new Error("O produto precisa de pelo menos uma foto.");

  const caminhos = [];
  const novas = [];
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (item.file) {
      const up = await uploadImage(item.file, "produtos");
      const caminho = up?.caminho || up?.url || "";
      if (!caminho) throw new Error("Falha ao enviar uma das fotos.");
      caminhos.push(caminho);
      novas.push({ caminho, ordem: i });
    } else if (item.caminho) {
      caminhos.push(item.caminho);
    }
  }

  const mantidas = new Set(images.filter((i) => i.imagemId).map((i) => i.imagemId));
  for (const orig of originalImages || []) {
    if (orig.imagemId && !mantidas.has(orig.imagemId)) {
      await deleteProdutoImagem(produtoId, orig.imagemId).catch(() => {});
    }
  }
  for (const nova of novas) {
    await addProdutoImagem(produtoId, nova).catch(() => {});
  }

  const payload = {
    nome,
    descricao: String(form.description || "").trim(),
    preco,
    estoque: Number(form.stock) || 0,
    imagemPrincipalUrl: caminhos[0],
    cores: cleanList(form.colors),
    tamanhos: cleanList(form.sizes),
  };
  if (categoriaId) payload.categoria = { id: Number(categoriaId) };

  return updateProduto(produtoId, payload);
}

export async function publicarProdutoApi(produtoId) {
  return updateProduto(produtoId, { status: "ativo" });
}

export async function inativarProdutoApi(produtoId) {
  return updateProduto(produtoId, { status: "inativo" });
}

export async function excluirProdutoApi(produtoId) {
  return deleteProduto(produtoId);
}

function formatDataHora(value) {
  return value ? new Date(value).toLocaleString("pt-BR") : "";
}

function formatData(value) {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

function itensDaLoja(itens, lojistaId) {
  return (itens || []).filter((i) => {
    const lid = i?.lojista?.id ?? i?.produto?.lojista?.id;
    return Number(lid) === Number(lojistaId);
  });
}

function mapPedidoLojista(p, mine, enderecoRaw, pagTipo) {
  const shopItemsTotal = mine.reduce((acc, i) => {
    const unit = Number(i.precoUnitario ?? i.produto?.preco ?? 0);
    return acc + unit * (i.quantidade || 1);
  }, 0);

  return {
    apiId: p.id,
    id: numeroPedidoLabel(mine, p.id),
    status: String(p.status || "").toLowerCase(),
    etapaEnvio: p.etapaEnvio || "aguardando",
    envioIniciadoEm:
      p.segundosDesdeEnvio != null ? Date.now() - Number(p.segundosDesdeEnvio) * 1000 : null,
    criadoEm: formatDataHora(p.criadoEm),
    cliente: {
      nome: p.usuario?.nome || "Cliente",
      email: p.usuario?.email || "—",
      cpf: "—",
      telefone: p.usuario?.telefone || "—",
      endereco: formatEndereco(enderecoRaw),
    },
    enderecoRaw: enderecoRaw || null,
    observacaoCliente: p.observacao || "",
    envio: {
      localPostagem: p.localPostagem || "",
      transportadora: p.transportadora || "",
      codigoRastreio: p.codigoRastreio || "",
      previsaoEntrega: formatData(p.previsaoEntrega),
      observacao: p.observacaoEnvio || "",
      recebidoEm: formatDataHora(p.recebidoEm),
      enviadoEm: formatDataHora(p.enviadoEm),
      entregueEm: formatDataHora(p.entregueEm),
    },
    freteNome: "Frete",
    freteLabel: "—",
    paymentMethod: formatPagamentoTipo(pagTipo),
    valor: formatBRL(Number(p.valorTotal) || 0),
    shopItemsTotal,
    items: mine.map((i) => ({
      id: i.id,
      name: i.produto?.nome || "Produto",
      image: resolveImageUrl(i.produto?.imagemPrincipalUrl) || "",
      quantity: i.quantidade || 1,
      lineTotal: Number(i.precoUnitario ?? i.produto?.preco ?? 0) * (i.quantidade || 1),
      color: i.cor || "",
      size: i.tamanho || "",
    })),
  };
}

function pagamentosPorPedido(pags) {
  const map = {};
  for (const pag of pags || []) {
    const pid = pag?.pedido?.id ?? pag?.pedidoId;
    if (pid != null) map[pid] = pag.tipo;
  }
  return map;
}

/**
 * Pedidos que contêm itens desta loja.
 */
export async function listPedidosDoLojista(lojistaId) {
  const [pedidos, pags] = await Promise.all([
    listTodosPedidos(),
    listPagamentos().catch(() => []),
  ]);
  const pagByPedido = pagamentosPorPedido(pags);
  const out = [];

  for (const p of pedidos || []) {
    let mine;
    try {
      mine = itensDaLoja(await getPedidoItens(p.id), lojistaId);
    } catch {
      continue;
    }
    if (!mine.length) continue;

    const enderecoRaw = await getPedidoEndereco(p.id).catch(() => null);
    out.push(mapPedidoLojista(p, mine, enderecoRaw, pagByPedido[p.id]));
  }

  return out.sort((a, b) => b.apiId - a.apiId);
}

export async function confirmarRecebimentoLojista(pedidoApiId, actorUsuarioId) {
  return confirmarRecebimentoPedido(pedidoApiId, actorUsuarioId);
}

export async function separarPedidoLojista(pedidoApiId, actorUsuarioId) {
  return atualizarStatusPedido(pedidoApiId, "em_separacao", actorUsuarioId);
}

export async function despacharPedidoLojista(
  pedidoApiId,
  actorUsuarioId,
  { localPostagem, transportadora, codigoRastreio },
) {
  return registrarEnvioPedido(pedidoApiId, {
    localPostagem,
    transportadora,
    codigoRastreio,
    actorUsuarioId,
  });
}

export async function cancelarPedidoLojista(pedidoApiId, actorUsuarioId) {
  return atualizarStatusPedido(pedidoApiId, "cancelado", actorUsuarioId);
}

