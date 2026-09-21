// Abrir/Fechar Modal
function openModal() {
  document.getElementById("modalLogin").style.display = "flex";
}

function closeModal() {
  document.getElementById("modalLogin").style.display = "none";
}

// Trocar visões (Cliente/Lojista)
function switchView(view) {
  document
    .querySelectorAll(".view-section")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSearch() {
  alert("Emily, aqui você pode criar um campo de busca flutuante no futuro!");
}

// Toggle menu mobile
function toggleMobileMenu() {
  const menu = document.querySelector(
    ".navbar-top-fixed.mobile-only .gaveta-flutuante",
  );
  const overlay = document.querySelector(
    ".navbar-top-fixed.mobile-only .mobile-overlay",
  );

  const isOpen = menu.classList.toggle("open");
  overlay.classList.toggle("active", isOpen);
}

function closeMobileMenu() {
  const menu = document.querySelector(
    ".navbar-top-fixed.mobile-only .gaveta-flutuante",
  );
  const overlay = document.querySelector(
    ".navbar-top-fixed.mobile-only .mobile-overlay",
  );

  menu.classList.remove("open");
  overlay.classList.remove("active");
}

// Fechar menu ao pressionar ESC
function onDocumentKeydown(event) {
  if (event.key === "Escape" || event.key === "Esc") {
    const menu = document.querySelector(
      ".navbar-top-fixed.mobile-only .gaveta-flutuante",
    );
    if (menu && menu.classList.contains("open")) {
      closeMobileMenu();
    }
  }
}

document.addEventListener("keydown", onDocumentKeydown);

// Abrir/fechar o carrinho lateral
function toggleCarrinho() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;
  const isOpen = drawer.classList.toggle("open");
  overlay.classList.toggle("active", isOpen);
}

// Exibir botão de carrinho apenas após o usuário estar logado
function logarUsuario() {
  document.getElementById("btn-login").classList.add("hidden");
  document.getElementById("btn-cadastro").classList.add("hidden");
  const cartIcon = document.getElementById("cartIcon");
  if (cartIcon) cartIcon.style.display = "flex";
}

// Função para abrir a confirmação de logout
function showLogoutConfirm() {
  document.getElementById("logoutOverlay").classList.add("active");
  document.getElementById("logoutModal").classList.add("active");
}

// Função para esconder a confirmação de logout
function hideLogoutConfirm() {
  document.getElementById("logoutOverlay").classList.remove("active");
  document.getElementById("logoutModal").classList.remove("active");
}

// Função chamada quando o usuário confirma o logout
function confirmLogout() {
  hideLogoutConfirm();
  logoutUsuario();
}

// Função para simular logout e restaurar os botões de login/cadastro
function logoutUsuario() {
  document.getElementById("btn-login").classList.remove("hidden");
  document.getElementById("btn-cadastro").classList.remove("hidden");
  const cartIcon = document.getElementById("cartIcon");
  if (cartIcon) cartIcon.style.display = "none";
}

// Estado local do carrinho
let cart = [];

// Adiciona produto ao carrinho e atualiza a interface
function addToCart(productName, productImage) {
  cart.push({ name: productName, image: productImage });
  updateCartUI();
  showMessage("Produto adicionado com sucesso!");
}

// Re-renderiza os itens e contador do carrinho
function updateCartUI() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  if (!cartItems || !cartCount) return;
  cartItems.innerHTML = "";
  cart.forEach((item) => {
    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <span>${item.name}</span>
      </div>
    `;
  });
  cartCount.textContent = cart.length;
}

// Mensagem temporária ao adicionar produto
function showMessage(message) {
  const msg = document.createElement("div");
  msg.textContent = message;
  msg.style.position = "fixed";
  msg.style.top = "50%";
  msg.style.left = "50%";
  msg.style.transform = "translate(-50%, -50%)";
  msg.style.background = "green";
  msg.style.color = "white";
  msg.style.padding = "12px 18px";
  msg.style.borderRadius = "8px";
  msg.style.zIndex = "1004";
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2000);
}

// Calcula frete com base no CEP informado
function calculateFreight() {
  const cep = document.getElementById("cepInput").value.trim();
  const result = document.getElementById("freightResult");
  if (!result) return;
  result.textContent =
    cep.length === 8 ? "Frete calculado: R$ 15,00" : "CEP inválido";
}

// Finaliza compra e esvazia o carrinho
function finalizePurchase() {
  if (cart.length > 0) {
    alert("Compra finalizada! Obrigado por comprar na AYVY.");
    cart = [];
    updateCartUI();
    toggleCarrinho();
  } else {
    alert("Carrinho vazio!");
  }
}

// Botões "Ver Loja" são apenas para ver o perfil/loja, não para adicionar ao carrinho.
// Se quiser adicionar um botão de compra depois, podemos criar um novo botão específico para isso.

// Função para fechar o menu mobile ao clicar em um link
function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.remove("open");
}

/* ============================================================
   FILTRO DO CARROSSEL: APENAS LOJAS COM +50k VIEWS
   ============================================================ 
function filtrarCarrossel() {
  const marcas = document.querySelectorAll('.brand-item'); // Pega todas as marcas
  const metaViews = 50000; // Define a sua meta de 50 mil

  marcas.forEach(marca => {
    // Pega o número de views que a gente escreveu no HTML
    const views = parseInt(marca.getAttribute('data-views'));

    if (views < metaViews) {
      // Se for menor que 50.000, remove a loja do carrossel
      marca.remove(); 
    }
  });
}

// Executa a função assim que o site carrega
window.addEventListener('DOMContentLoaded', filtrarCarrossel); */
