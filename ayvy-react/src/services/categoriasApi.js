import { apiJson } from "./api";

export function listCategoriasApi() {
  return apiJson("/categorias");
}
