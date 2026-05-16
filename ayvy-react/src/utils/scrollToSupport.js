/** Comportamento alinhado ao legado (navbar.js): scroll suave ou navegação para /#support-section. */
export default function scrollToSupportSection() {
  const support = document.getElementById("support-section");
  if (support) {
    support.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.href = "/#support-section";
}
