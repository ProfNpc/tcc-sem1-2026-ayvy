// Transforma 129.9 em "R$ 129,90".
export function formatarPreco(valor) {
  const numero = Number(valor) || 0;
  return 'R$ ' + numero.toFixed(2).replace('.', ',');
}
