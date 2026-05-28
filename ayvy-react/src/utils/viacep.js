/**
 * Consulta endereço pelo CEP (ViaCEP).
 * @param {string} rawCep
 * @returns {Promise<{ ok: true, data: { logradouro: string, bairro: string, cidade: string, estado: string } } | { ok: false, error: 'invalid' | 'notfound' | 'network' }>}
 */
export async function fetchAddressByCep(rawCep) {
  const cep = String(rawCep || "").replace(/\D/g, "");
  if (cep.length !== 8) {
    return { ok: false, error: "invalid" };
  }
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) {
      return { ok: false, error: "notfound" };
    }
    return {
      ok: true,
      data: {
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      },
    };
  } catch {
    return { ok: false, error: "network" };
  }
}
