import { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  async function entrar(email, senha) {
    const dados = await loginApi(email, senha);

    // O app é só para clientes: lojistas e administradores usam o site.
    if (dados.papel !== 'cliente') {
      const erro = new Error('Este aplicativo é exclusivo para clientes. Lojistas e administradores devem usar o site.');
      erro.amigavel = true;
      throw erro;
    }
    setUsuario(dados);
  }

  function sair() {
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Atalho: qualquer tela chama useAuth() para saber quem está logado.
export function useAuth() {
  return useContext(AuthContext);
}
