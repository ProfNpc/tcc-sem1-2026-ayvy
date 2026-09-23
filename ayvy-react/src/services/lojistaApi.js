import {
  addProdutoImagem,
  createProduto,
  deleteProduto,
  listCategorias,
  listProdutos,
  updateProduto,
  uploadImage,
} from "./adminApi";
import {
  atualizarStatusPedido,
  getPedidoEndereco,
  getPedidoItens,
  listPagamentos,
  listTodosPedidos,
} from "./pedidosApi";
import { resolveImageUrl } from "../utils/imageUrl";
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
  };
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

export async function publicarProdutoApi(produtoId) {
  return updateProduto(produtoId, { status: "ativo" });
}

export async function inativarProdutoApi(produtoId) {
  return updateProduto(produtoId, { status: "inativo" });
}

export async function excluirProdutoApi(produtoId) {
  return deleteProduto(produtoId);
}

/**
 * Pedidos que contêm itens desta loja.
 */
export async function listPedidosDoLojista(lojistaId) {
  const [pedidos, pags] = await Promise.all([
    listTodosPedidos(),
    listPagamentos().catch(() => []),
  ]);
  const pagByPedido = {};
  for (const pag of pags || []) {
    const pid = pag?.pedido?.id ?? pag?.pedidoId;
    if (pid != null) pagByPedido[pid] = pag.tipo;
  }

  const out = [];

  for (const p of pedidos || []) {
    let itens = [];
    try {
      itens = await getPedidoItens(p.id);
    } catch {
      continue;
    }
    const mine = (itens || []).filter((i) => {
      const lid = i?.lojista?.id ?? i?.produto?.lojista?.id;
      return Number(lid) === Number(lojistaId);
    });
    if (!mine.length) continue;

    const shopItemsTotal = mine.reduce((acc, i) => {
      const unit = Number(i.precoUnitario ?? i.produto?.preco ?? 0);
      return acc + unit * (i.quantidade || 1);
    }, 0);

    let endereco = "—";
    try {
      endereco = formatEndereco(await getPedidoEndereco(p.id));
    } catch {
      /* ignore */
    }

    out.push({
      apiId: p.id,
      id: `#AY-${p.id}`,
      status: String(p.status || "").toLowerCase(),
      criadoEm: p.criadoEm
        ? new Date(p.criadoEm).toLocaleString("pt-BR")
        : "",
      cliente: {
        nome: p.usuario?.nome || "Cliente",
        email: p.usuario?.email || "—",
        cpf: "—",
        telefone: p.usuario?.telefone || "—",
        endereco,
      },
      freteNome: "Frete",
      freteLabel: "—",
      paymentMethod: formatPagamentoTipo(pagByPedido[p.id]),
      valor: formatBRL(Number(p.valorTotal) || 0),
      shopItemsTotal,
      items: mine.map((i) => ({
        id: i.id,
        name: i.produto?.nome || "Produto",
        image: resolveImageUrl(i.produto?.imagemPrincipalUrl) || "",
        quantity: i.quantidade || 1,
        lineTotal:
          Number(i.precoUnitario ?? i.produto?.preco ?? 0) * (i.quantidade || 1),
        color: "",
        size: "",
      })),
    });
  }

  return out;
}

export async function enviarPedidoLojista(pedidoApiId, actorUsuarioId) {
  return atualizarStatusPedido(pedidoApiId, "enviado", actorUsuarioId);
}

export async function cancelarPedidoLojista(pedidoApiId, actorUsuarioId) {
  return atualizarStatusPedido(pedidoApiId, "cancelado", actorUsuarioId);
}
