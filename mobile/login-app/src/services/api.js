import { API_URL } from '../config';

// Função base: todas as chamadas à API passam por aqui.
async function request(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });

  if (!resposta.ok) {
    const erro = new Error(`Erro ${resposta.status}`);
    erro.status = resposta.status; // ex.: 401 = e-mail/senha inválidos
    throw erro;
  }
  if (resposta.status === 204) return null; // 204 = sucesso sem corpo (DELETE)
  return resposta.json();
}

// ---------- Usuário ----------
export function login(email, senha) {
  return request('/usuarios/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

// ---------- Produtos ----------
export function listarProdutos() {
  return request('/produtos');
}

// A API devolve o caminho relativo (/uploads/produtos/x.jpg); aqui montamos o endereço completo.
export function urlImagem(caminho) {
  if (!caminho) return null;
  if (caminho.startsWith('http')) return caminho;
  return `${API_URL}${caminho}`;
}

// ---------- Favoritos ----------
export function listarFavoritos(usuarioId) {
  return request(`/favoritos?usuarioId=${usuarioId}`);
}

export function favoritar(usuarioId, produtoId) {
  return request('/favoritos', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, produtoId }),
  });
}

export function desfavoritar(usuarioId, produtoId) {
  return request(`/favoritos?usuarioId=${usuarioId}&produtoId=${produtoId}`, {
    method: 'DELETE',
  });
}
