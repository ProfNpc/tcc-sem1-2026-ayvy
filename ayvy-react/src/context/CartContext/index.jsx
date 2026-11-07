/**
 * Carrinho do site (localStorage "ayvy.cart.v2") e cálculo de frete (POST /frete/calcular).
 * Com o cliente logado, o carrinho também fica salvo na conta (GET/PUT /carrinho) e é o mesmo do app:
 * ao entrar junta o carrinho do navegador com o da conta, salva a cada mudança e busca de novo
 * quando a aba volta a ficar ativa (e a cada 20 s). Ao sair da conta, o carrinho do navegador é limpo.
 * Use com useCart(). importLines/updateLineOptions são usados na importação do carrinho do app (pages/Carrinho).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "../AuthContext";
import { buscarCarrinhoDaConta, salvarCarrinhoDaConta } from "../../services/carrinhoApi";
import { resolveImageUrl } from "../../utils/imageUrl";
import {
  cartLineKey,
  cartSubtotal,
  formatBRL,
  formatCep,
  lineSubtotal,
} from "../../utils/cartHelpers";
import { calcularFrete } from "../../services/pedidosApi";
import { fetchAddressByCep } from "../../utils/viacep";
import "./style.css";

const CART_KEY = "ayvy.cart.v2";
/** Id da conta com que o carrinho do navegador já foi juntado (vazio = carrinho de visitante). */
const CART_OWNER_KEY = "ayvy.cart.owner";
const ENVIO_ATRASO_MS = 600;
const BUSCA_INTERVALO_MS = 20000;
const IMAGEM_PADRAO = "/assets/img/ayvy-media-a.png";

const EMPTY_FREIGHT = {
  cep: "",
  city: "",
  uf: "",
  selectedOptionId: null,
  loading: false,
  error: "",
  cepConfirmed: false,
  editingCep: true,
  options: [],
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

function listaLimpa(lista) {
  return Array.isArray(lista) ? lista.map((v) => String(v).trim()).filter(Boolean) : [];
}

/** Item salvo na conta (GET /carrinho) → linha do carrinho do site. */
function linhaDaConta(item) {
  const p = item?.produto || {};
  return {
    name: p.nome || "Produto",
    image: resolveImageUrl(p.imagemPrincipalUrl) || IMAGEM_PADRAO,
    price: formatBRL(Number(p.precoFinal ?? p.preco) || 0),
    quantity: item.quantidade || 1,
    productId: String(p.id),
    apiId: p.id,
    shopSlug: String(p.lojista?.slug || "").trim().toLowerCase().replace(/-/g, "_"),
    shopName: p.lojista?.nomeLoja || "",
    stock: p.estoque,
    colors: listaLimpa(p.cores),
    sizes: listaLimpa(p.tamanhos),
    color: item.cor || null,
    size: item.tamanho || null,
  };
}

/** Linha do site → formato do PUT /carrinho (linhas sem produto da API não vão para a conta). */
function linhaParaConta(line) {
  const produtoId = Number(line.apiId ?? line.productId);
  if (!Number.isFinite(produtoId)) return null;
  return {
    produtoId,
    quantidade: line.quantity || 1,
    cor: line.color || null,
    tamanho: line.size || null,
  };
}

/** Junta o carrinho de visitante com o da conta: linhas iguais ficam com a maior quantidade. */
function juntarCarrinhos(daConta, doNavegador) {
  const resultado = daConta.map((l) => ({ ...l, id: crypto.randomUUID() }));
  for (const local of doNavegador) {
    const chave = cartLineKey(local);
    const igual = resultado.find((l) => cartLineKey(l) === chave);
    if (igual) {
      igual.quantity = Math.max(igual.quantity || 1, local.quantity || 1);
    } else {
      resultado.push(local);
    }
  }
  return resultado;
}

function lerDono() {
  try {
    return localStorage.getItem(CART_OWNER_KEY) || "";
  } catch {
    return "";
  }
}

function gravarDono(valor) {
  try {
    if (valor) localStorage.setItem(CART_OWNER_KEY, valor);
    else localStorage.removeItem(CART_OWNER_KEY);
  } catch {
    /* ignore */
  }
}

/** Mantém o carrinho do navegador igual ao salvo na conta (o mesmo carrinho do app). */
function useCarrinhoDaConta(usuarioId, cart) {
  const ignorarEnvioRef = useRef(false);
  const envioPendenteRef = useRef(null);
  const usuarioAnteriorRef = useRef(usuarioId);

  const aplicarDaConta = useCallback((linhas) => {
    ignorarEnvioRef.current = true;
    setCartAndNotify(linhas);
  }, []);

  const buscarDaConta = useCallback(async () => {
    if (!usuarioId || envioPendenteRef.current) return;
    try {
      const itens = await buscarCarrinhoDaConta(usuarioId);
      if (envioPendenteRef.current) return;
      const daConta = (itens || []).map(linhaDaConta);
      const semApi = cartSnapshot.filter((l) => !linhaParaConta(l));
      aplicarDaConta(juntarCarrinhos(daConta, semApi));
    } catch {
      /* sem conexão: mantém o carrinho do navegador */
    }
  }, [usuarioId, aplicarDaConta]);

  useEffect(() => {
    const anterior = usuarioAnteriorRef.current;
    usuarioAnteriorRef.current = usuarioId;
    if (!usuarioId) {
      if (anterior) {
        gravarDono("");
        setCartAndNotify([]);
      }
      return undefined;
    }
    let cancelado = false;
    (async () => {
      try {
        const itens = await buscarCarrinhoDaConta(usuarioId);
        if (cancelado) return;
        const daConta = (itens || []).map(linhaDaConta);
        const jaJuntado = lerDono() === String(usuarioId) && !envioPendenteRef.current;
        const resultado = jaJuntado
          ? juntarCarrinhos(daConta, cartSnapshot.filter((l) => !linhaParaConta(l)))
          : juntarCarrinhos(daConta, cartSnapshot);
        gravarDono(String(usuarioId));
        aplicarDaConta(resultado);
        if (!jaJuntado) {
          await salvarCarrinhoDaConta(usuarioId, resultado.map(linhaParaConta).filter(Boolean));
        }
      } catch {
        /* sem conexão: tenta de novo na próxima mudança ou quando a aba voltar */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [usuarioId, aplicarDaConta]);

  useEffect(() => {
    if (!usuarioId) return undefined;
    if (ignorarEnvioRef.current) {
      ignorarEnvioRef.current = false;
      return undefined;
    }
    if (lerDono() !== String(usuarioId)) return undefined;
    const timer = setTimeout(async () => {
      try {
        await salvarCarrinhoDaConta(usuarioId, cart.map(linhaParaConta).filter(Boolean));
      } catch {
        /* tenta de novo na próxima mudança */
      } finally {
        if (envioPendenteRef.current === timer) envioPendenteRef.current = null;
      }
    }, ENVIO_ATRASO_MS);
    envioPendenteRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (envioPendenteRef.current === timer) envioPendenteRef.current = null;
    };
  }, [cart, usuarioId]);

  useEffect(() => {
    if (!usuarioId) return undefined;
    function aoVoltar() {
      if (document.visibilityState === "visible") buscarDaConta();
    }
    window.addEventListener("focus", aoVoltar);
    document.addEventListener("visibilitychange", aoVoltar);
    const intervalo = setInterval(aoVoltar, BUSCA_INTERVALO_MS);
    return () => {
      window.removeEventListener("focus", aoVoltar);
      document.removeEventListener("visibilitychange", aoVoltar);
      clearInterval(intervalo);
    };
  }, [usuarioId, buscarDaConta]);
}

export default function CartProvider({ children }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { user } = useAuth();
  useCarrinhoDaConta(user?.id ?? null, cart);
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

  /**
   * Adiciona várias linhas de uma vez (importação do app), somando com linhas iguais.
   * Com `manterMaior` (cliente logado, carrinho já sincronizado com o app) fica a maior quantidade,
   * para não contar em dobro o que já veio pela conta.
   */
  const importLines = useCallback((incomingLines, { manterMaior = false } = {}) => {
    let next = [...cartSnapshot];
    for (const incoming of incomingLines || []) {
      const key = cartLineKey(incoming);
      const idx = next.findIndex((line) => cartLineKey(line) === key);
      if (idx >= 0) {
        next = next.map((line, i) =>
          i === idx
            ? {
                ...line,
                quantity: manterMaior
                  ? Math.max(line.quantity || 1, incoming.quantity || 1)
                  : (line.quantity || 1) + (incoming.quantity || 1),
              }
            : line,
        );
      } else {
        next = [...next, { ...incoming, id: crypto.randomUUID() }];
      }
    }
    setCartAndNotify(next);
  }, []);

  /** Define cor/tamanho de uma linha; se já existir a mesma variante, junta as duas. */
  const updateLineOptions = useCallback((lineId, options) => {
    const current = cartSnapshot.find((line) => line.id === lineId);
    if (!current) return;
    const updated = { ...current, ...options };
    const key = cartLineKey(updated);
    const twin = cartSnapshot.find(
      (line) => line.id !== lineId && cartLineKey(line) === key,
    );
    const next = twin
      ? cartSnapshot
          .filter((line) => line.id !== lineId)
          .map((line) =>
            line.id === twin.id
              ? { ...line, quantity: (line.quantity || 1) + (current.quantity || 1) }
              : line,
          )
      : cartSnapshot.map((line) => (line.id === lineId ? updated : line));
    setCartAndNotify(next);
  }, []);

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
    return freight.options?.length ? freight.options : [];
  }, [freight.cepConfirmed, freight.cep, freight.options]);

  const selectedFreight = useMemo(() => {
    if (shippingOptions.length === 0) return null;
    return (
      shippingOptions.find((o) => o.id === freight.selectedOptionId) ??
      shippingOptions[0]
    );
  }, [shippingOptions, freight.selectedOptionId]);

  const freightValue =
    freight.cepConfirmed && selectedFreight ? selectedFreight.price : 0;
  const total = subtotal + freightValue;

  const clear = useCallback(() => {
    setCartAndNotify([]);
    setFreight(EMPTY_FREIGHT);
  }, []);

  const startEditCep = useCallback(() => {
    setFreight((f) => ({
      ...f,
      editingCep: true,
      cepConfirmed: false,
      selectedOptionId: null,
      error: "",
    }));
  }, []);

  const calculateFreight = useCallback(
    async (cepRaw) => {
      const cep = String(cepRaw || "").replace(/\D/g, "");
      if (cep.length !== 8) {
        setFreight((f) => ({
          ...f,
          error: "CEP inválido. Digite 8 números.",
          cepConfirmed: false,
          selectedOptionId: null,
          loading: false,
        }));
        return;
      }

      setFreight((f) => ({
        ...f,
        loading: true,
        error: "",
        cepConfirmed: false,
        selectedOptionId: null,
      }));

      const result = await fetchAddressByCep(cep);
      if (!result.ok) {
        const msg =
          result.error === "notfound"
            ? "CEP não encontrado."
            : result.error === "invalid"
              ? "CEP inválido."
              : "Erro ao consultar CEP. Tente novamente.";
        setFreight((f) => ({
          ...f,
          loading: false,
          error: msg,
          cepConfirmed: false,
          selectedOptionId: null,
          options: [],
        }));
        return;
      }

      const apiItens = cart
        .map((line) =>
          line.apiId ??
          (Number.isFinite(Number(line.productId)) ? Number(line.productId) : null),
        )
        .filter((id) => id != null)
        .map((produtoId) => ({ produtoId }));

      if (apiItens.length === 0) {
        setFreight((f) => ({
          ...f,
          loading: false,
          error:
            "Frete só é calculado para produtos cadastrados na API. Remova itens antigos do carrinho.",
          cepConfirmed: false,
          selectedOptionId: null,
          options: [],
        }));
        return;
      }

      let options = [];
      try {
        const valorApi = await calcularFrete({
          cepDestino: cep,
          itens: apiItens,
        });
        const price = Number(valorApi);
        if (!Number.isFinite(price)) {
          throw new Error("Resposta de frete inválida");
        }
        options = [
          {
            id: "api",
            name: "Frete AYVY",
            days: "Valor calculado pela API conforme distância",
            price,
            priceLabel: price === 0 ? "Grátis" : formatBRL(price),
          },
        ];
      } catch (err) {
        setFreight((f) => ({
          ...f,
          loading: false,
          error:
            err?.message ||
            "Não foi possível calcular o frete na API. Tente novamente.",
          cepConfirmed: false,
          selectedOptionId: null,
          options: [],
        }));
        return;
      }

      setFreight({
        cep,
        city: result.data.cidade,
        uf: result.data.estado,
        selectedOptionId: options[0]?.id ?? null,
        loading: false,
        error: "",
        cepConfirmed: true,
        editingCep: false,
        options,
      });
    },
    [cart],
  );

  const selectFreightOption = useCallback((optionId) => {
    setFreight((f) => ({ ...f, selectedOptionId: optionId }));
  }, []);

  const goToCartPage = useCallback(() => {
    if (cart.length === 0) {
      alert("O carrinho de compras está vazio!");
      return;
    }
    setDrawerOpen(false);
    // navegação fica no CartDrawer (precisa do useNavigate)
  }, [cart.length]);

  const finalizePurchase = goToCartPage;

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
      importLines,
      updateLineOptions,
      updateQuantity,
      removeLine,
      clear,
      calculateFreight,
      selectFreightOption,
      startEditCep,
      finalizePurchase,
      goToCartPage,
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
      importLines,
      updateLineOptions,
      updateQuantity,
      removeLine,
      clear,
      calculateFreight,
      selectFreightOption,
      startEditCep,
      finalizePurchase,
      goToCartPage,
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
