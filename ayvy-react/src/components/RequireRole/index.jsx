import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPostLoginPath } from "../../utils/mockAuthUsers";
import "./style.css";

/**
 * @param {{ role: string | string[], children: import("react").ReactNode }} props
 */
export default function RequireRole({ role, children }) {
  const { loggedIn, user } = useAuth();
  const location = useLocation();
  const allowed = Array.isArray(role) ? role : [role];

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  return children;
}
