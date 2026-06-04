/**
 * Chamadas do painel admin → back Spring Boot.
 * URL base: api.js (VITE_API_BASE_URL ou http://localhost:8082)
 */
import { apiFetch, apiJson } from "./api";

// ——— Usuários ———

export function listUsuarios() {
  // GET /usuarios — lista na tela /admin/usuarios
  return apiJson("/usuarios");
}

export function getUsuario(id) {
  // GET /usuarios/:id — formulário Editar usuário
  return apiJson(`/usuarios/${id}`);
}

export function createUsuario(payload) {
  // POST /usuarios — novo usuário ou modal rápido (body: nome, email, senha, papel, status…)
  return apiJson("/usuarios", { method: "POST", body: payload });
}

export function updateUsuario(id, payload) {
  // PUT /usuarios/:id — editar usuário ou status do lojista responsável
  return apiJson(`/usuarios/${id}`, { method: "PUT", body: payload });
}

export function deleteUsuario(id) {
  // DELETE /usuarios/:id
  return apiFetch(`/usuarios/${id}`, { method: "DELETE" });
}

// ——— Clientes ———

export function listClientes() {
  // GET /clientes — lista /admin/clientes (traz usuario aninhado)
  return apiJson("/clientes");
}

export function getCliente(id) {
  // GET /clientes/:id
  return apiJson(`/clientes/${id}`);
}

export function createCliente(payload) {
  // POST /clientes — vincula usuarioId com papel cliente
  return apiJson("/clientes", { method: "POST", body: payload });
}

export function updateCliente(id, payload) {
  // PUT /clientes/:id
  return apiJson(`/clientes/${id}`, { method: "PUT", body: payload });
}

export function deleteCliente(id) {
  // DELETE /clientes/:id
  return apiFetch(`/clientes/${id}`, { method: "DELETE" });
}

// ——— Lojistas ———

export function listLojistas() {
  // GET /lojistas — lista /admin/lojistas
  return apiJson("/lojistas");
}

export function getLojista(id) {
  // GET /lojistas/:id — formulário Editar loja
  return apiJson(`/lojistas/${id}`);
}

export function createLojista(payload) {
  // POST /lojistas — nova loja (usuarioId, nomeLoja, slug, cnpj…)
  return apiJson("/lojistas", { method: "POST", body: payload });
}

export function updateLojista(id, payload) {
  // PUT /lojistas/:id — dados da loja (não altera status do usuario)
  return apiJson(`/lojistas/${id}`, { method: "PUT", body: payload });
}

export function deleteLojista(id) {
  // DELETE /lojistas/:id
  return apiFetch(`/lojistas/${id}`, { method: "DELETE" });
}

// ——— Produtos ———

export function listProdutos() {
  // GET /produtos — lista /admin/produtos
  return apiJson("/produtos");
}

export function getProduto(id) {
  // GET /produtos/:id
  return apiJson(`/produtos/${id}`);
}

export function createProduto(payload) {
  // POST /produtos — cadastro (status ativo ou rascunho)
  return apiJson("/produtos", { method: "POST", body: payload });
}

export function updateProduto(id, payload) {
  // PUT /produtos/:id — edição (pode mudar status para inativo, esgotado…)
  return apiJson(`/produtos/${id}`, { method: "PUT", body: payload });
}

export function deleteProduto(id) {
  // DELETE /produtos/:id
  return apiFetch(`/produtos/${id}`, { method: "DELETE" });
}

export function listProdutoImagens(produtoId) {
  // GET /produtos/:produtoId/imagens — galeria no form
  return apiJson(`/produtos/${produtoId}/imagens`);
}

export function addProdutoImagem(produtoId, body) {
  // POST /produtos/:produtoId/imagens
  return apiJson(`/produtos/${produtoId}/imagens`, { method: "POST", body });
}

export function deleteProdutoImagem(produtoId, imagemId) {
  // DELETE /produtos/:produtoId/imagens/:imagemId
  return apiFetch(`/produtos/${produtoId}/imagens/${imagemId}`, { method: "DELETE" });
}

// ——— Categorias ———

export function listCategorias() {
  // GET /categorias — select no form de produto
  return apiJson("/categorias");
}

// ——— Upload ———

export function uploadImage(file, pasta) {
  // POST /upload — multipart; pasta: usuarios | lojistas | produtos
  const form = new FormData();
  form.append("file", file);
  form.append("pasta", pasta);
  return apiFetch("/upload", { method: "POST", body: form });
}
