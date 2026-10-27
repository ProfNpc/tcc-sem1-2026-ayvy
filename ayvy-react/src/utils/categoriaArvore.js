function porOrdem(a, b) {
  return (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.nome).localeCompare(String(b.nome), "pt-BR");
}

/**
 * Monta a árvore a partir de GET /categorias:
 * [{ ...principal, filhas: [...subcategorias] }], só com categorias ativas.
 */
export function montarArvoreCategorias(categorias) {
  const ativas = (categorias || []).filter((c) => c.ativo !== false);
  const ids = new Set(ativas.map((c) => c.id));
  const principais = ativas
    .filter((c) => !c.categoriaPai || !ids.has(c.categoriaPai.id))
    .sort(porOrdem);
  return principais.map((p) => ({
    ...p,
    filhas: ativas.filter((c) => c.categoriaPai?.id === p.id).sort(porOrdem),
  }));
}

/** Id da categoria principal de uma categoria (ela mesma, se já for principal). */
export function idPrincipal(categoria) {
  if (!categoria) return null;
  return categoria.categoriaPai?.id ?? categoria.id;
}
