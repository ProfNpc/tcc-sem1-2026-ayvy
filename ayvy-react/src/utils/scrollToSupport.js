/**
 * Rolagens da home: ir até o Suporte AYVY (fim da página) e voltar ao topo (logo AYVY / Início).
 *
 * Atenção: NÃO usar scrollIntoView/scrollTo com behavior "smooth" aqui. A animação suave do navegador
 * continua rodando mesmo depois de trocar de página (ex.: clicar em Sobre no meio da descida), e a
 * página nova abria no fim ou "travava". Por isso a animação é nossa (requestAnimationFrame) e pode
 * ser cancelada: ao trocar de página (cancelarRolagemSuporte no MainLayout) ou quando a pessoa rola
 * com o mouse, toca na tela ou usa o teclado.
 */

let rolagemAtual = 0;
const DURACAO_MS = 700;

/** Cancela qualquer rolagem automática em andamento (e as correções pendentes). */
export function cancelarRolagemSuporte() {
  rolagemAtual += 1;
}

// Se a pessoa mexer na página, a rolagem automática para na hora.
if (typeof window !== "undefined") {
  for (const evento of ["wheel", "touchstart", "keydown"]) {
    window.addEventListener(evento, cancelarRolagemSuporte, { passive: true });
  }
}

/** Posição final para mostrar o elemento no topo (respeita scroll-margin e o zoom da página). */
function destinoDe(elemento) {
  const atual = window.scrollY;
  elemento.scrollIntoView({ block: "start", behavior: "instant" });
  const destino = window.scrollY;
  window.scrollTo({ top: atual, behavior: "instant" });
  return destino;
}

function animarAte(destino, minhaRolagem, duracao = DURACAO_MS) {
  const inicio = window.scrollY;
  const t0 = performance.now();
  function passo(agora) {
    if (minhaRolagem !== rolagemAtual) return;
    const p = Math.min(1, (agora - t0) / duracao);
    const suave = 1 - (1 - p) ** 3;
    window.scrollTo({ top: inicio + (destino - inicio) * suave, behavior: "instant" });
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/** Scroll para o único bloco Suporte AYVY (fim da home). */
export default function scrollToSupportSection() {
  const support = document.getElementById("support-section");
  if (support) {
    rolarAteSuporte(support);
    return;
  }
  window.location.href = "/#support-section";
}

/**
 * Rola até o Suporte e corrige o destino algumas vezes: enquanto a rolagem acontece,
 * as fotos dos produtos terminam de carregar e a página cresce.
 */
export function rolarAteSuporte(support) {
  const minhaRolagem = ++rolagemAtual;
  animarAte(destinoDe(support), minhaRolagem);
  for (const ms of [DURACAO_MS + 150, 1500, 2400]) {
    setTimeout(() => {
      if (minhaRolagem !== rolagemAtual || !support.isConnected) return;
      const destino = destinoDe(support);
      if (Math.abs(destino - window.scrollY) > 40) animarAte(destino, minhaRolagem, 400);
    }, ms);
  }
}

/** Logo AYVY / "Início": volta para o topo (suave se já estiver na home). */
export function subirParaInicio() {
  const minhaRolagem = ++rolagemAtual;
  if (window.location.pathname === "/") {
    animarAte(0, minhaRolagem);
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
