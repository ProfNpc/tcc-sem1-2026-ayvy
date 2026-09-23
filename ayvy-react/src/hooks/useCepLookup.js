import { useCallback, useRef, useState } from "react";
import { formatCep } from "../utils/cartHelpers";
import { fetchAddressByCep } from "../utils/viacep";

/**
 * Busca endereço no ViaCEP assim que o CEP completa 8 dígitos.
 * @param {(data: { logradouro: string, bairro: string, cidade: string, estado: string }) => void} onFound
 */
export default function useCepLookup(onFound) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const lastCep = useRef("");
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  const lookupCep = useCallback(async (rawCep) => {
    const digits = String(rawCep || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) {
      setCepError("");
      return;
    }
    if (digits === lastCep.current) return;
    lastCep.current = digits;
    setCepLoading(true);
    setCepError("");
    const result = await fetchAddressByCep(digits);
    setCepLoading(false);
    if (!result.ok) {
      lastCep.current = "";
      if (result.error === "notfound") setCepError("CEP não encontrado.");
      else if (result.error === "network") {
        setCepError("Erro ao buscar CEP. Tente novamente.");
      }
      return;
    }
    onFoundRef.current?.(result.data);
  }, []);

  function formatAndLookup(raw) {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 8);
    const formatted = formatCep(digits);
    if (digits.length === 8) {
      void lookupCep(digits);
    } else {
      lastCep.current = "";
      setCepError("");
    }
    return { digits, formatted };
  }

  return { lookupCep, formatAndLookup, cepLoading, cepError, setCepError };
}
