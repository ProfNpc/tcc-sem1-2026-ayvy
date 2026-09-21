(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function ensurePlaceholder() {
    let host = byId("ayvy-navbar");
    if (!host) {
      host = document.createElement("div");
      host.id = "ayvy-navbar";
      document.body.prepend(host);
    }
    return host;
  }

  function scrollToSupport() {
    const support = byId("support-section");
    if (support) {
      support.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.href = "/#support-section";
  }

  async function mount() {
    const host = ensurePlaceholder();
    document.body.classList.add("has-ayvy-navbar");

    try {
      const response = await fetch("assets/components/navbar.html", {
        cache: "no-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to load navbar.html (${response.status})`);
      }
      host.innerHTML = await response.text();
    } catch (err) {
      console.error("AyvyNavbar: erro carregando navbar.html", err);
      host.innerHTML = "";
    }

    if (window.AyvyAuth && typeof window.AyvyAuth.applyNavbarState === "function") {
      window.AyvyAuth.applyNavbarState();
    }

    if (window.AyvyCart && typeof window.AyvyCart.updateCartUI === "function") {
      window.AyvyCart.updateCartUI();
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        const menu = byId("mobileMenu");
        if (menu && menu.classList.contains("open")) {
          closeMobileMenu();
        }
      }
    });
  }

  function toggleMobileMenu() {
    const menu = byId("mobileMenu");
    const overlay = document.querySelector(".navbar-top-fixed.mobile-only .mobile-overlay");
    if (!menu || !overlay) return;
    const isOpen = menu.classList.toggle("open");
    overlay.classList.toggle("active", isOpen);
  }

  function closeMobileMenu() {
    const menu = byId("mobileMenu");
    const overlay = document.querySelector(".navbar-top-fixed.mobile-only .mobile-overlay");
    if (!menu || !overlay) return;
    menu.classList.remove("open");
    overlay.classList.remove("active");
  }

  function showLogoutConfirm() {
    const overlay = byId("logoutOverlay");
    const modal = byId("logoutModal");
    if (!overlay || !modal) return;
    overlay.classList.add("active");
    modal.classList.add("active");
  }

  function hideLogoutConfirm() {
    const overlay = byId("logoutOverlay");
    const modal = byId("logoutModal");
    if (!overlay || !modal) return;
    overlay.classList.remove("active");
    modal.classList.remove("active");
  }

  function confirmLogout() {
    hideLogoutConfirm();
    if (window.AyvyAuth && typeof window.AyvyAuth.logout === "function") {
      window.AyvyAuth.logout();
    }
    window.location.replace("/");
  }

  window.AyvyNavbar = {
    mount,
    toggleMobileMenu,
    closeMobileMenu,
    showLogoutConfirm,
    hideLogoutConfirm,
    confirmLogout,
    scrollToSupport,
  };
})();

