import { formatBRL } from "./cartHelpers";

/**
 * Simula opções de frete após validar CEP (até integrar transportadora real).
 * @param {string} cep - 8 dígitos
 * @param {number} subtotal
 */
export function getShippingOptions(cep, subtotal) {
  const d = String(cep || "").replace(/\D/g, "");
  const first = d[0] || "0";
  let base = 14.9;
  if (first === "0" || first === "1") base = 9.82;
  else if (first === "2" || first === "3") base = 11.5;
  else if (first === "4" || first === "5") base = 13.2;

  const freeThreshold = 299;
  const discount = subtotal >= freeThreshold ? base : 0;

  const options = [
    {
      id: "economico",
      name: "AYVY Econômico",
      days: "Chega em 7 a 10 dias úteis",
      price: Math.max(0, base - discount),
    },
    {
      id: "expresso",
      name: "AYVY Expresso",
      days: "Chega em 4 a 6 dias úteis",
      price: Math.max(0, base + 6 - discount * 0.5),
    },
    {
      id: "rapido",
      name: "Entrega rápida",
      days: "Chega em 2 a 3 dias úteis",
      price: Math.max(0, base + 12 - discount * 0.3),
    },
  ];

  return options.map((o) => ({
    ...o,
    priceLabel: o.price === 0 ? "Grátis" : formatBRL(o.price),
  }));
}
