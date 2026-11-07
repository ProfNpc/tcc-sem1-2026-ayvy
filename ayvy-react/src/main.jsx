/**
 * Ponto de entrada do site: monta BrowserRouter → AuthProvider (login) → CartProvider (carrinho) → App.
 * A ordem importa: o CartProvider usa o useAuth() para sincronizar o carrinho com a conta.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext";
import CartProvider from "./context/CartContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
