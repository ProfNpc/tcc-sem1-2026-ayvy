# AYVY Mobile (Expo) · guia completo do app

App para **clientes** da AYVY: login, início (lojas, produtos, filtros, favoritos), carrinho, pedidos e conta.
O pagamento é feito no site. O **carrinho e os favoritos são os mesmos do site**, porque ficam salvos na conta pela API.
Clique nos links para abrir a linha exata; no topo de cada arquivo há um comentário explicando para que ele serve.
Mapa geral: [../../README.md](../../README.md).

## Índice

1. [Primeira vez](#1-primeira-vez)
2. [Para onde o app aponta (API e site)](#2-para-onde-o-app-aponta-api-e-site)
3. [Arquivos e telas](#3-arquivos-e-telas)
4. [Carrinho e favoritos iguais ao site](#4-carrinho-e-favoritos-iguais-ao-site)
5. [Chamadas da API](#5-chamadas-da-api)
6. [Pontos de atenção (onde mais dá erro)](#6-pontos-de-atenção-onde-mais-dá-erro)

---

## 1. Primeira vez

```sh
npm install
npx expo install react-native-safe-area-context
npx expo start          # depois "w" para abrir no navegador ou o QR code no Expo Go
```

O segundo comando instala o pacote que mede as barras do Android (status e navegação), para o layout não ficar por baixo delas.

## 2. Para onde o app aponta (API e site)

Crie o `.env.local` (copie de `.env.example`) e reinicie com `npx expo start --clear`.

| Onde o app roda | Onde a API roda | O que fazer |
|---|---|---|
| Navegador (`npm run web`) | mesmo computador | nada: padrão `http://localhost:8082` |
| Emulador Android | computador do emulador | nada: padrão `http://10.0.2.2:8082` ([api.js](api.js#L16)) |
| Celular real (Expo Go) | computador na mesma Wi-Fi | `EXPO_PUBLIC_API_BASE_URL=http://IP-DO-COMPUTADOR:8082` |
| Celular com Expo num Codespace | computador da escola | `ngrok http 8082` e use a URL `https://...ngrok...` |

No Windows o IP aparece no `ipconfig` (campo "Endereço IPv4"). Libere as portas `8082` (API) e `5173` (site) no firewall, e rode o site com `npm run dev -- --host`.
A tela de login mostra no rodapé a API que o app está usando.

## 3. Arquivos e telas

O app usa os arquivos **da raiz** de `login-app/`. A pasta `src/` e os arquivos com "(1)" no nome são versões antigas e não são usados.

| Arquivo | Para que serve | Linha principal |
|---|---|---|
| [`index.js`](index.js) → [`App.js`](App.js) | entrada; sem sessão → Login, com sessão → CartProvider + MainApp | [App](App.js#L13) |
| [`MainApp.js`](MainApp.js) | troca de abas (Início, Carrinho, Pedidos, Conta) | [MainApp](MainApp.js#L16) |
| [`LoginScreen.js`](LoginScreen.js) | login (só clientes ativos) | [LoginScreen](LoginScreen.js#L21) |
| [`HomeScreen.js`](HomeScreen.js) | lojas, produtos, busca, filtros, favoritos, perfil da loja | [HomeScreen](HomeScreen.js#L150) |
| [`CartScreen.js`](CartScreen.js) | carrinho e "Finalizar compra no site" | [checkoutOnSite](CartScreen.js#L57) |
| [`OrdersScreen.js`](OrdersScreen.js) | histórico de pedidos e linha do tempo | [OrdersScreen](OrdersScreen.js#L123) |
| [`AccountScreen.js`](AccountScreen.js) | conta e sair | [AccountScreen](AccountScreen.js#L23) |
| [`CartContext.js`](CartContext.js) | carrinho salvo na conta | [CartProvider](CartContext.js#L37) |
| [`ProductCard.js`](ProductCard.js) · [`StoreScreen.js`](StoreScreen.js) · [`StoreAvatar.js`](StoreAvatar.js) · [`HorizontalList.js`](HorizontalList.js) | peças da tela inicial | — |
| [`TabBar.js`](TabBar.js) · [`ScreenHeader.js`](ScreenHeader.js) | barra de abas e título | — |
| [`api.js`](api.js) | toda a comunicação com a API | [apiRequest](api.js#L30) |
| [`links.js`](links.js) · [`notify.js`](notify.js) · [`format.js`](format.js) · [`theme.js`](theme.js) | links para o site, alertas, formatação e cores | [aviso do checkout](links.js#L30) |

## 4. Carrinho e favoritos iguais ao site

| O quê | Onde | Como funciona |
|---|---|---|
| Carregar o carrinho da conta | [loadFromAccount](CartContext.js#L45) | `GET /carrinho?usuarioId=` ao entrar, ao voltar para o app e a cada 20 s |
| Salvar cada mudança | [saveAccountCart](CartContext.js#L72) | `PUT /carrinho` com o carrinho inteiro (meio segundo depois do último clique) |
| Linha com cor/tamanho do site | [lineKey](CartContext.js#L19) | mesma peça em outra cor/tamanho é outra linha |
| Favoritos | [toggleFavorite](HomeScreen.js#L335) · [refreshFavorites](HomeScreen.js#L214) | `GET/POST/DELETE /favoritos`; recarrega ao voltar para o app e a cada 20 s |

## 5. Chamadas da API

| Função | Linha | Endpoint |
|---|---|---|
| Login | [authenticateClient](api.js#L74) | `POST /usuarios/login` (só `papel = cliente` e `status = ativo`) |
| Catálogo | [listProducts](api.js#L97) | `GET /produtos`, `/lojistas`, `/categorias` |
| Favoritos | [listFavorites](api.js#L110) | `/favoritos` |
| Carrinho da conta | [getAccountCart](api.js#L129) · [saveAccountCart](api.js#L134) | `GET/PUT /carrinho` |
| Pedidos | [listOrders](api.js#L142) | `GET /pedidos?usuarioId=`, `/itens`, `/historico` |
| Imagens | [resolveImageUrl](api.js#L155) | junta a API com `/uploads/...` |

## 6. Pontos de atenção (onde mais dá erro)

1. **"Não foi possível conectar à API"**: o endereço do `.env.local` está errado, ou a API/firewall bloqueia o celular. No emulador Android use `10.0.2.2`, nunca `localhost`.
2. **Mudou o `.env.local` e nada mudou**: reinicie com `npx expo start --clear`.
3. **Carrinho diferente do site**: confira se as duas pontas entraram com o **mesmo e-mail**. A atualização acontece a cada 20 s ou ao voltar para o app.
4. **Conta de lojista/admin não entra**: o app é só para clientes ([regra](api.js#L81)).
5. **Expo muda a cada versão**: antes de usar uma API nova do Expo, confira a documentação da versão do `package.json` (ver `AGENTS.md`).
