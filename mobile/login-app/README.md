# AYVY Mobile

Aplicativo Expo para clientes AYVY. Telas: login (só clientes), início (lojas e produtos, favoritos, adicionar ao carrinho), carrinho, histórico de pedidos e conta. O pagamento é feito no site.

## Primeira vez (uma vez só)

```sh
npm install
npx expo install react-native-safe-area-context
```

O segundo comando instala o pacote que mede as barras do Android (status e navegação), usado para o layout não ficar por baixo delas.

## Para onde o app aponta (API e site)

Crie o arquivo `.env.local` (copie de `.env.example`) e reinicie com `npx expo start --clear`.

| Onde o app roda | Onde a API roda | O que fazer |
|---|---|---|
| Navegador (`npm run web`) | No mesmo computador do navegador | Nada: o padrão `http://localhost:8082` já serve |
| Emulador Android | No computador do emulador | Nada: o padrão `http://10.0.2.2:8082` já serve |
| Celular Android real (Expo Go) | No computador da mesma rede Wi-Fi | `EXPO_PUBLIC_API_BASE_URL=http://IP-DO-COMPUTADOR:8082` |
| Celular, com o Expo num Codespace | No computador da escola | Exponha a API com ngrok (`ngrok http 8082`) e use a URL `https://...ngrok...` |

Para saber o IP do computador no Windows: `ipconfig` (campo "Endereço IPv4"). A porta `8082` (API) e `5173` (site) precisam estar liberadas no firewall, e o site precisa rodar com `npm run dev -- --host` para o celular alcançá-lo.

A tela de login mostra, no rodapé, a API que o app está usando. Se aparecer um endereço errado, ajuste o `.env.local`.

## Estrutura

- `App.js`: monta tudo e decide entre login e telas principais.
- `LoginScreen.js`, `MainApp.js`: login e navegação por abas.
- `HomeScreen.js`, `CartScreen.js`, `OrdersScreen.js`, `AccountScreen.js`: as telas.
- `ProductCard.js`, `TabBar.js`, `ScreenHeader.js`: peças reutilizáveis.
- `api.js`: toda a comunicação com a API. `CartContext.js`: carrinho.
- `theme.js`, `format.js`, `notify.js`, `links.js`: cores, formatação, avisos e links.

## Limitação conhecida

O carrinho do app fica só no celular. Por padrão ele não é enviado ao site: ao tocar em "Finalizar compra no site", a pessoa monta o carrinho de novo por lá. Quando o site importar o carrinho pela URL (`/carrinho?itens=10:2,15:1`), defina `EXPO_PUBLIC_CART_HANDOFF=true` no `.env.local` e o app passa a enviar os itens. Apenas contas com papel `cliente` e status `ativo` entram no app.
