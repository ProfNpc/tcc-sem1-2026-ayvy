/** Scroll para o único bloco Suporte AYVY (home). */
export default function scrollToSupportSection() {
  const support = document.getElementById("support-section");
  if (support) {
    support.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.href = "/#support-section";
}
