import { apiFetch, apiJson } from "./api";

// ——— Usuários ———
export function listUsuarios() {
  return apiJson("/usuarios");
}

export function getUsuario(id) {
  return apiJson(`/usuarios/${id}`);
}

export function createUsuario(payload) {
  return apiJson("/usuarios", { method: "POST", body: payload });
}

export function updateUsuario(id, payload) {
  return apiJson(`/usuarios/${id}`, { method: "PUT", body: payload });
}

export function deleteUsuario(id) {
  return apiFetch(`/usuarios/${id}`, { method: "DELETE" });
}

// ——— Clientes ———
export function listClientes() {
  return apiJson("/clientes");
}

export function getCliente(id) {
  return apiJson(`/clientes/${id}`);
}

export function createCliente(payload) {
  return apiJson("/clientes", { method: "POST", body: payload });
}

export function updateCliente(id, payload) {
  return apiJson(`/clientes/${id}`, { method: "PUT", body: payload });
}

export function deleteCliente(id) {
  return apiFetch(`/clientes/${id}`, { method: "DELETE" });
}

// ——— Lojistas ———
export function listLojistas() {
  return apiJson("/lojistas");
}

export function getLojista(id) {
  return apiJson(`/lojistas/${id}`);
}

export function createLojista(payload) {
  return apiJson("/lojistas", { method: "POST", body: payload });
}

export function updateLojista(id, payload) {
  return apiJson(`/lojistas/${id}`, { method: "PUT", body: payload });
}

export function deleteLojista(id) {
  return apiFetch(`/lojistas/${id}`, { method: "DELETE" });
}

// ——— Produtos ———
export function listProdutos() {
  return apiJson("/produtos");
}

export function getProduto(id) {
  return apiJson(`/produtos/${id}`);
}

export function createProduto(payload) {
  return apiJson("/produtos", { method: "POST", body: payload });
}

export function updateProduto(id, payload) {
  return apiJson(`/produtos/${id}`, { method: "PUT", body: payload });
}

export function deleteProduto(id) {
  return apiFetch(`/produtos/${id}`, { method: "DELETE" });
}

export function listProdutoImagens(produtoId) {
  return apiJson(`/produtos/${produtoId}/imagens`);
}

export function addProdutoImagem(produtoId, body) {
  return apiJson(`/produtos/${produtoId}/imagens`, { method: "POST", body });
}

export function deleteProdutoImagem(produtoId, imagemId) {
  return apiFetch(`/produtos/${produtoId}/imagens/${imagemId}`, { method: "DELETE" });
}

// ——— Categorias ———
export function listCategorias() {
  return apiJson("/categorias");
}

// ——— Upload ———
export function uploadImage(file, pasta) {
  const form = new FormData();
  form.append("file", file);
  form.append("pasta", pasta);
  return apiFetch("/upload", { method: "POST", body: form });
}
