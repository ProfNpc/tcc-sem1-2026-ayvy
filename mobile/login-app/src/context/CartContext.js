import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Cada item: { produto, quantidade }
  const [itens, setItens] = useState([]);

  // Devolve true se adicionou, false se já atingiu o estoque.
  function adicionar(produto) {
    const existente = itens.find((i) => i.produto.id === produto.id);
    if (existente && existente.quantidade >= produto.estoque) {
      return false;
    }
    if (existente) {
      setItens(
        itens.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      );
    } else {
      setItens([...itens, { produto, quantidade: 1 }]);
    }
    return true;
  }

  function limpar() {
    setItens([]);
  }

  const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const valorTotal = itens.reduce((soma, i) => soma + i.quantidade * Number(i.produto.preco), 0);

  return (
    <CartContext.Provider value={{ itens, adicionar, limpar, quantidadeTotal, valorTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
