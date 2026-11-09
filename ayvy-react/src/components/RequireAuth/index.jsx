/**
 * Protege rotas que exigem login: sem login, manda para /login guardando a página de origem (from).
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./style.css";

export default function RequireAuth({ children }) {
  const { loggedIn } = useAuth();
  const location = useLocation();
  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
