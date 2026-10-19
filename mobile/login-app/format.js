// "R$ 1.299,90"
export function formatPrice(value) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : 0;
  const [integer, decimals] = safe.toFixed(2).split('.');
  return `R$ ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimals}`;
}

// "14/10/2026 18:30" a partir de "2026-10-14T18:30:00.123456"
export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(String(iso).replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "14/10/2026" a partir de "2026-10-14"
export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function firstName(fullName) {
  return String(fullName || 'Cliente').trim().split(/\s+/)[0];
}
