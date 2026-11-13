import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getAccountCart, saveAccountCart } from './api';

// O carrinho fica salvo na conta (API /carrinho) e é o mesmo do site: o que a pessoa adiciona aqui
// aparece no carrinho do site quando ela entra com o mesmo e-mail, e vice-versa.
const CartContext = createContext(null);

const SAVE_DELAY_MS = 500;
const REFRESH_INTERVAL_MS = 20000;

// Quantidade máxima que se pode comprar de um produto: soma das variações ativas ("estoqueDisponivel").
// O campo "estoque" do produto ficou desatualizado depois do estoque por variação.
function stockLimit(product) {
  const stock = Number(product?.estoqueDisponivel);
  return Number.isFinite(stock) ? stock : Infinity;
}

// Mesma peça em outra cor/tamanho (escolhidos no site) é outra linha.
function lineKey(productId, cor, tamanho) {
  return `${productId}|${cor || ''}|${tamanho || ''}`;
}

function fromAccount(item) {
  return {
    key: lineKey(item.produto?.id, item.cor, item.tamanho),
    product: item.produto,
    quantity: item.quantidade,
    cor: item.cor || null,
    tamanho: item.tamanho || null,
  };
}

export function unitPrice(product) {
  return Number(product?.precoFinal ?? product?.preco ?? 0);
}

export function CartProvider({ user, children }) {
  // Cada item: { key, product, quantity, cor, tamanho }
  const [items, setItems] = useState([]);
  const loadedRef = useRef(false);
  const skipSaveRef = useRef(false);
  const pendingSaveRef = useRef(null);
  const userId = user?.id;

  const loadFromAccount = useCallback(async () => {
    if (!userId || pendingSaveRef.current) return;
    try {
      const list = await getAccountCart(userId);
      if (pendingSaveRef.current) return;
      skipSaveRef.current = true;
      setItems((Array.isArray(list) ? list : []).filter((i) => i?.produto?.id != null).map(fromAccount));
      loadedRef.current = true;
    } catch (error) {
      console.warn('Não foi possível carregar o carrinho da conta:', error.message);
    }
  }, [userId]);

  // Ao entrar: traz o carrinho salvo na conta.
  useEffect(() => {
    loadFromAccount();
  }, [loadFromAccount]);

  // A cada mudança: salva o carrinho inteiro na conta (com um pequeno atraso para juntar cliques).
  useEffect(() => {
    if (!userId || !loadedRef.current) return undefined;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        await saveAccountCart(
          userId,
          items.map((i) => ({ produtoId: i.product.id, quantidade: i.quantity, cor: i.cor, tamanho: i.tamanho })),
        );
      } catch (error) {
        console.warn('Não foi possível salvar o carrinho na conta:', error.message);
      } finally {
        if (pendingSaveRef.current === timer) pendingSaveRef.current = null;
      }
    }, SAVE_DELAY_MS);
    pendingSaveRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (pendingSaveRef.current === timer) pendingSaveRef.current = null;
    };
  }, [items, userId]);

  // Quando o app volta para a frente (e a cada 20 s), busca o que mudou no site.
  useEffect(() => {
    if (!userId) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadFromAccount();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') loadFromAccount();
    }, REFRESH_INTERVAL_MS);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [userId, loadFromAccount]);

  // Devolve true se adicionou e false se já atingiu o estoque.
  const addItem = useCallback(
    (product) => {
      const totalOfProduct = items
        .filter((item) => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (totalOfProduct >= stockLimit(product)) return false;
      const key = lineKey(product.id);
      const existing = items.find((item) => item.key === key);
      setItems(
        existing
          ? items.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item))
          : [...items, { key, product, quantity: 1, cor: null, tamanho: null }],
      );
      return true;
    },
    [items],
  );

  const setQuantity = useCallback(
    (key, quantity) => {
      if (quantity <= 0) {
        setItems(items.filter((item) => item.key !== key));
        return;
      }
      setItems(
        items.map((item) =>
          item.key === key ? { ...item, quantity: Math.min(quantity, stockLimit(item.product)) } : item,
        ),
      );
    },
    [items],
  );

  const removeItem = useCallback((key) => setItems(items.filter((item) => item.key !== key)), [items]);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () => ({
      totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.quantity * unitPrice(item.product), 0),
    }),
    [items],
  );

  const value = { items, addItem, setQuantity, removeItem, clearCart, reload: loadFromAccount, ...totals };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
