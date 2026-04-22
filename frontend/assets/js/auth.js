(() => {
  const AUTH_KEY = "ayvy.auth";

  function isLoggedIn() {
    try {
      return localStorage.getItem(AUTH_KEY) === "1";
    } catch {
      return false;
    }
  }

  function loginMock(email, password) {
    if (!email || !password) return false;
    try {
      localStorage.setItem(AUTH_KEY, "1");
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
  }

  function requireGuest() {
    if (isLoggedIn()) {
      window.location.replace("/");
    }
  }

  function applyNavbarState() {
    const logged = isLoggedIn();

    const btnLogin = document.getElementById("btn-login");
    const btnCadastro = document.getElementById("btn-cadastro");

    const cartIcon = document.getElementById("navCartIcon");
    const cartIconMobile = document.getElementById("navCartIconMobile");

    if (btnLogin) btnLogin.style.display = logged ? "none" : "";
    if (btnCadastro) btnCadastro.style.display = logged ? "none" : "";

    if (cartIcon) cartIcon.style.display = logged ? "flex" : "none";
    if (cartIconMobile) cartIconMobile.style.display = logged ? "flex" : "none";
  }

  window.AyvyAuth = {
    isLoggedIn,
    loginMock,
    logout,
    requireGuest,
    applyNavbarState,
  };
})();

