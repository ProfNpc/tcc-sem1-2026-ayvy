import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

// Quantidade máxima que se pode comprar de um produto (o estoque).
function stockLimit(product) {
  const stock = Number(product?.estoque);
  return Number.isFinite(stock) ? stock : Infinity;
}

export function CartProvider({ children }) {
  // Cada item: { product, quantity }
  const [items, setItems] = useState([]);

  // Devolve true se adicionou e false se já atingiu o estoque.
  const addItem = useCallback(
    (product) => {
      const existing = items.find((item) => item.product.id === product.id);
      if ((existing?.quantity || 0) >= stockLimit(product)) return false;
      setItems(
        existing
          ? items.map((item) =>
              item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          : [...items, { product, quantity: 1 }],
      );
      return true;
    },
    [items],
  );

  const setQuantity = useCallback(
    (productId, quantity) => {
      if (quantity <= 0) {
        setItems(items.filter((item) => item.product.id !== productId));
        return;
      }
      setItems(
        items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(quantity, stockLimit(item.product)) }
            : item,
        ),
      );
    },
    [items],
  );

  const removeItem = useCallback(
    (productId) => setItems(items.filter((item) => item.product.id !== productId)),
    [items],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () => ({
      totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.quantity * Number(item.product.preco || 0), 0),
    }),
    [items],
  );

  const value = { items, addItem, setQuantity, removeItem, clearCart, ...totals };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
