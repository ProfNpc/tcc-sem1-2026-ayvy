import { Linking } from 'react-native';
import { WEB_BASE_URL } from './api';
import { notify } from './notify';

// Abre um endereço no navegador do celular.
export function openUrl(url) {
  Promise.resolve()
    .then(() => Linking.openURL(url))
    .catch(() => notify('Não foi possível abrir o link', url));
}

// Ligue (EXPO_PUBLIC_CART_HANDOFF=true no .env.local) quando o site já importar o carrinho pela URL.
// Desligado, o app abre o carrinho do site sem enviar nada, e o aviso abaixo explica isso.
export const CART_HANDOFF_ENABLED = process.env.EXPO_PUBLIC_CART_HANDOFF === 'true';

// Monta o endereço do carrinho do site. Com o envio ligado, leva os itens no formato produtoId:quantidade
// (ex.: /carrinho?itens=10:2,15:1). Só ids e quantidades vão na URL: os preços o site busca na API.
export function buildCartUrl(items) {
  const base = `${WEB_BASE_URL}/carrinho`;
  if (!CART_HANDOFF_ENABLED || !items.length) return base;
  const itens = items.map((item) => `${item.product.id}:${item.quantity}`).join(',');
  return `${base}?itens=${itens}`;
}

// Aviso mostrado antes de mandar a pessoa para o site: o pagamento só existe lá.
export const CHECKOUT_NOTICE = CART_HANDOFF_ENABLED
  ? 'O pagamento é feito no site da AYVY. Seus itens serão enviados ao carrinho do site, e você precisará entrar na sua conta no site para pagar.'
  : 'O pagamento é feito no site da AYVY. Os itens do carrinho do app ainda não são enviados ao site, então adicione-os novamente por lá. Você também precisará entrar na sua conta no site.';
