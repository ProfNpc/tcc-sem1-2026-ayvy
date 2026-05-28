import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/LoginForm";
import { useAuth } from "../../context/AuthContext";
import { getPostLoginPath } from "../../utils/mockAuthUsers";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { loginPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

export default function Login() {
  const { loggedIn, loginMock, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const justSubmittedRef = useRef(false);

  useExternalStylesOnce(loginPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  /** Só redireciona quem já estava logado ao abrir /login (evita competir com o submit). */
  useEffect(() => {
    if (justSubmittedRef.current) return;
    if (!loggedIn || !role || !user) return;

    const dest = getPostLoginPath(user, location.state?.from);
    navigate(dest, { replace: true });
  }, [loggedIn, role, user, location.state, navigate]);

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const login = String(new FormData(form).get("username") || "").trim();
    const password = String(new FormData(form).get("password") || "").trim();
    const session = loginMock(login, password);

    if (!session) {
      alert("Preencha usuário e senha.");
      return;
    }

    justSubmittedRef.current = true;
    const dest = getPostLoginPath(session, location.state?.from);
    navigate(dest, { replace: true });
  }

  const animStyle = visible
    ? { opacity: 1, transform: "translateY(0)" }
    : { opacity: 0, transform: "translateY(10px)" };

  return (
    <main
      className="container"
      style={{
        display: "block",
        ...animStyle,
        transition: "opacity 400ms ease, transform 400ms ease",
      }}
    >
      <LoginForm onSubmit={onSubmit} />
    </main>
  );
}
