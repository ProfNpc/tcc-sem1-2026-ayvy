import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import "./style.css";

const CART_KEY = "ayvy.cart.v1";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}

let cartSnapshot = readCart();
const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return cartSnapshot;
}

function setCartAndNotify(next) {
  cartSnapshot = next;
  writeCart(next);
  listeners.forEach((l) => l());
}

export default function CartProvider({ children }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [freightText, setFreightText] = useState("");

  const toggle = useCallback(() => {
    setDrawerOpen((o) => !o);
  }, []);

  const addItem = useCallback(
    (name, image) => {
      const next = [...cart, { name, image }];
      setCartAndNotify(next);
    },
    [cart],
  );

  const clear = useCallback(() => {
    setCartAndNotify([]);
    setFreightText("");
  }, []);

  const calculateFreight = useCallback((cepRaw) => {
    const cep = String(cepRaw || "").replace(/\D/g, "");
    setFreightText(
      cep.length === 8 ? "Frete calculado: R$ 15,00" : "CEP inválido",
    );
  }, []);

  const finalizePurchase = useCallback(() => {
    if (cart.length === 0) {
      alert("Carrinho vazio!");
      return;
    }
    alert("Compra finalizada! Obrigado por comprar na AYVY.");
    clear();
    setDrawerOpen(false);
  }, [cart.length, clear]);

  const value = useMemo(
    () => ({
      cart,
      drawerOpen,
      freightText,
      setFreightText,
      toggle,
      addItem,
      clear,
      calculateFreight,
      finalizePurchase,
      setDrawerOpen,
    }),
    [
      cart,
      drawerOpen,
      freightText,
      toggle,
      addItem,
      clear,
      calculateFreight,
      finalizePurchase,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const CartContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
