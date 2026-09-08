(() => {
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
      // ignore
    }
  }

  function updateCartUI() {
    const cart = readCart();

    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartCountMobile = document.getElementById("cartCountMobile");

    if (cartCount) cartCount.textContent = String(cart.length);
    if (cartCountMobile) cartCountMobile.textContent = String(cart.length);

    if (cartItems) {
      cartItems.innerHTML = "";
      cart.forEach((item) => {
        cartItems.innerHTML += `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" />
            <span>${item.name}</span>
          </div>
        `;
      });
    }
  }

  function toggle() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (!drawer || !overlay) return;

    const isOpen = drawer.classList.toggle("open");
    overlay.classList.toggle("active", isOpen);
  }

  function addItem(name, image) {
    const cart = readCart();
    cart.push({ name, image });
    writeCart(cart);
    updateCartUI();
  }

  function clear() {
    writeCart([]);
    updateCartUI();
  }

  function calculateFreight() {
    const cep = document.getElementById("cepInput")?.value?.trim() ?? "";
    const result = document.getElementById("freightResult");
    if (!result) return;
    result.textContent = cep.length === 8 ? "Frete calculado: R$ 15,00" : "CEP inválido";
  }

  function finalizePurchase() {
    const cart = readCart();
    if (cart.length === 0) {
      alert("Carrinho vazio!");
      return;
    }
    alert("Compra finalizada! Obrigado por comprar na AYVY.");
    clear();
    toggle();
  }

  window.AyvyCart = {
    toggle,
    addItem,
    updateCartUI,
    calculateFreight,
    finalizePurchase,
    clear,
  };
})();

