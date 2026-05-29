import { listClientes, listLojistas, listProdutos } from "../services/adminApi";
import { resolveImageUrl } from "./imageUrl";

export const ADMIN_METRICS_CHANGED = "ayvy-admin-metrics-changed";

export const EMPTY_METRICS = {
  lojistasCadastrados: 0,
  lojistasPendentes: 0,
  produtosCadastrados: 0,
  clientesCadastrados: 0,
};

export function notifyAdminMetricsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_METRICS_CHANGED));
  }
}

export async function fetchAdminMetrics() {
  const [clientes, lojistas, produtos] = await Promise.all([
    listClientes(),
    listLojistas(),
    listProdutos(),
  ]);

  const produtosArr = Array.isArray(produtos) ? produtos : [];
  const countByLojista = {};
  for (const p of produtosArr) {
    const lid = p.lojista?.id ?? p.lojistaId;
    if (lid != null) countByLojista[lid] = (countByLojista[lid] || 0) + 1;
  }

  const lojaList = (Array.isArray(lojistas) ? lojistas : []).map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.nomeLoja,
    handle: `@${l.slug}`,
    avatar: resolveImageUrl(l.logoUrl) || "/assets/img/img-curta-ayvy.jpeg",
    products: countByLojista[l.id] ?? 0,
    status: l.status,
  }));

  return {
    metrics: {
      lojistasCadastrados: lojaList.length,
      lojistasPendentes: lojaList.filter((s) => s.status === "pendente").length,
      produtosCadastrados: produtosArr.length,
      clientesCadastrados: (Array.isArray(clientes) ? clientes : []).length,
    },
    recentLojistas: lojaList.slice(0, 6),
  };
}
