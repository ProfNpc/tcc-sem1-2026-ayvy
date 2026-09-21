import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/LoginForm";
import { useAuth } from "../../context/AuthContext";
import { getPostLoginPath } from "../../utils/mockAuthUsers";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { loginPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

export default function Login() {
  const { loggedIn, login, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const justSubmittedRef = useRef(false);

  useExternalStylesOnce(loginPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (justSubmittedRef.current) return;
    if (!loggedIn || !role || !user) return;

    const dest = getPostLoginPath(user, location.state?.from);
    navigate(dest, { replace: true });
  }, [loggedIn, role, user, location.state, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const email = String(new FormData(form).get("username") || "").trim();
    const password = String(new FormData(form).get("password") || "").trim();

    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const session = await login(email, password);
      justSubmittedRef.current = true;
      const dest = getPostLoginPath(session, location.state?.from);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
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
      {error ? (
        <p style={{ color: "#b00020", textAlign: "center", marginBottom: "0.75rem" }}>{error}</p>
      ) : null}
      <LoginForm onSubmit={onSubmit} loading={loading} />
    </main>
  );
}
