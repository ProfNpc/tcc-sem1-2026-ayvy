# AYVY — React + Vite

SPA migrada do frontend estático (`/frontend`). Estilos globais do legado: `public/assets/css/geral.css` (referenciado no `index.html`). Demais estilos: apenas **CSS** (`.css`) em `src/` por página/componente.

## Scripts

- `npm run dev` — desenvolvimento  
- `npm run build` — build de produção  
- `npm run lint` — ESLint  

## Estrutura

`src/assets` (images, icons, styles), `components/`, `pages/`, `routes/AppRoutes.jsx`, `context/`, `hooks/`, `services/`, `utils/`.

## Variáveis de ambiente (opcional)

- `VITE_API_BASE_URL` — base URL da API quando integrar o backend (`src/services/api.js`).
