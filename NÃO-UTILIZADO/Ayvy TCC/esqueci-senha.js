// Animação de entrada do formulário
setTimeout(() => {
  const el = document.querySelector(".container");
  if (!el) return;

  el.style.display = "block";
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  el.style.transition = "opacity 400ms ease, transform 400ms ease";

  void el.offsetWidth; // Força o navegador a processar o estilo antes da animação

  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}, 100);
