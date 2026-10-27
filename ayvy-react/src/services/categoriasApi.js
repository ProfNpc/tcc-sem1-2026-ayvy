/**
 * Árvore de categorias (GET /categorias). Cada item traz categoriaPai, icone e ordem.
 * Usado por: pages/Categorias (montada com utils/categoriaArvore.js). Back: CategoriaController.
 */
import { apiJson } from "./api";

export function listCategoriasApi() {
  return apiJson("/categorias");
}
