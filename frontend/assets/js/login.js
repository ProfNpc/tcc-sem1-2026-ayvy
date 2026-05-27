// Animação de entrada do formulário
setTimeout(() => {
  const el = document.querySelector(".container");
  if (!el) return;

  el.style.display = "block";
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  el.style.transition = "opacity 400ms ease, transform 400ms ease";

  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}, 100);

// Guard: se já estiver logado, não pode acessar login
if (window.AyvyAuth) {
  window.AyvyAuth.requireGuest();
}

// Mock login: qualquer email + senha faz login
window.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("main.container form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll("input");
    const email = inputs?.[0]?.value?.trim() ?? "";
    const password = inputs?.[1]?.value?.trim() ?? "";

    const ok = window.AyvyAuth?.loginMock(email, password);
    if (!ok) {
      alert("Preencha email e senha.");
      return;
    }

    window.location.replace("/");
  });
});

