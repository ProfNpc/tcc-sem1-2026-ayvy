import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  cartLineKey,
  cartSubtotal,
  formatBRL,
  formatCep,
  lineSubtotal,
} from "../../utils/cartHelpers";
import { getShippingOptions } from "../../utils/freightMock";
import { fetchAddressByCep } from "../../utils/viacep";
import "./style.css";

const CART_KEY = "ayvy.cart.v2";

const EMPTY_FREIGHT = {
  cep: "",
  city: "",
  uf: "",
  selectedOptionId: null,
  loading: false,
  error: "",
  cepConfirmed: false,
  editingCep: true,
};

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((line) =>
      line.id ? line : { ...line, id: crypto.randomUUID() },
    );
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
  const [freight, setFreight] = useState(EMPTY_FREIGHT);

  const toggle = useCallback(() => {
    setDrawerOpen((o) => !o);
  }, []);

  const addItem = useCallback(
    (itemOrName, imageLegacy) => {
      const incoming =
        typeof itemOrName === "string"
          ? { name: itemOrName, image: imageLegacy, quantity: 1, price: "R$ 0,00" }
          : { ...itemOrName, quantity: itemOrName.quantity ?? 1 };

      const key = cartLineKey(incoming);
      const idx = cart.findIndex((line) => cartLineKey(line) === key);

      let next;
      if (idx >= 0) {
        next = cart.map((line, i) =>
          i === idx
            ? { ...line, quantity: (line.quantity || 1) + (incoming.quantity || 1) }
            : line,
        );
      } else {
        next = [...cart, { ...incoming, id: crypto.randomUUID() }];
      }
      setCartAndNotify(next);
    },
    [cart],
  );

  const updateQuantity = useCallback(
    (lineId, delta) => {
      const next = cart
        .map((line) => {
          if (line.id !== lineId) return line;
          const qty = (line.quantity || 1) + delta;
          return qty < 1 ? null : { ...line, quantity: qty };
        })
        .filter(Boolean);
      setCartAndNotify(next);
    },
    [cart],
  );

  const removeLine = useCallback(
    (lineId) => {
      setCartAndNotify(cart.filter((line) => line.id !== lineId));
    },
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + (i.quantity || 1), 0),
    [cart],
  );

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);

  const shippingOptions = useMemo(() => {
    if (!freight.cepConfirmed || !freight.cep) return [];
    return getShippingOptions(freight.cep, subtotal);
  }, [freight.cepConfirmed, freight.cep, subtotal]);

  const selectedFreight = useMemo(() => {
    if (shippingOptions.length === 0) return null;
    return (
      shippingOptions.find((o) => o.id === freight.selectedOptionId) ??
      shippingOptions[0]
    );
  }, [shippingOptions, freight.selectedOptionId]);

  const freightValue = selectedFreight?.price ?? 0;
  const total = subtotal + freightValue;

  const clear = useCallback(() => {
    setCartAndNotify([]);
    setFreight(EMPTY_FREIGHT);
  }, []);

  const startEditCep = useCallback(() => {
    setFreight((f) => ({
      ...f,
      editingCep: true,
      error: "",
    }));
  }, []);

  const calculateFreight = useCallback(
    async (cepRaw) => {
      const cep = String(cepRaw || "").replace(/\D/g, "");
      if (cep.length !== 8) {
        setFreight((f) => ({ ...f, error: "CEP inválido. Digite 8 números." }));
        return;
      }

      setFreight((f) => ({ ...f, loading: true, error: "" }));

      const result = await fetchAddressByCep(cep);
      if (!result.ok) {
        const msg =
          result.error === "notfound"
            ? "CEP não encontrado."
            : result.error === "invalid"
              ? "CEP inválido."
              : "Erro ao consultar CEP. Tente novamente.";
        setFreight((f) => ({ ...f, loading: false, error: msg }));
        return;
      }

      const options = getShippingOptions(cep, subtotal);
      setFreight({
        cep,
        city: result.data.cidade,
        uf: result.data.estado,
        selectedOptionId: options[0]?.id ?? null,
        loading: false,
        error: "",
        cepConfirmed: true,
        editingCep: false,
      });
    },
    [subtotal],
  );

  const selectFreightOption = useCallback((optionId) => {
    setFreight((f) => ({ ...f, selectedOptionId: optionId }));
  }, []);

  const finalizePurchase = useCallback(() => {
    if (cart.length === 0) {
      alert("O carrinho de compras está vazio!");
      return;
    }
    if (!freight.cepConfirmed || !selectedFreight) {
      alert("Calcule e selecione uma opção de frete.");
      return;
    }
    alert(
      `Compra finalizada!\nTotal: ${formatBRL(total)}\nFrete: ${selectedFreight.name} — ${selectedFreight.priceLabel}`,
    );
    clear();
    setDrawerOpen(false);
  }, [cart.length, clear, freight.cepConfirmed, selectedFreight, total]);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      drawerOpen,
      freight,
      shippingOptions,
      subtotal,
      freightValue,
      total,
      toggle,
      addItem,
      updateQuantity,
      removeLine,
      clear,
      calculateFreight,
      selectFreightOption,
      startEditCep,
      finalizePurchase,
      setDrawerOpen,
      formatBRL,
      lineSubtotal,
      formatCep,
    }),
    [
      cart,
      cartCount,
      drawerOpen,
      freight,
      shippingOptions,
      subtotal,
      freightValue,
      total,
      toggle,
      addItem,
      updateQuantity,
      removeLine,
      clear,
      calculateFreight,
      selectFreightOption,
      startEditCep,
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
