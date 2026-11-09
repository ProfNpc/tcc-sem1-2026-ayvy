/**
 * Raiz visual do site: as rotas (routes/AppRoutes.jsx) + o carrinho lateral (components/CartDrawer),
 * que fica fora das rotas para abrir em qualquer tela.
 */
import AppRoutes from "./routes/AppRoutes";
import CartDrawer from "./components/CartDrawer";

export default function App() {
  return (
    <>
      <AppRoutes />
      <CartDrawer />
    </>
  );
}
