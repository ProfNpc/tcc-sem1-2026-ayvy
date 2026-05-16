import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/LoginForm";
import { useAuth } from "../../context/AuthContext";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { loginPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

export default function Login() {
  const { loggedIn, loginMock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useExternalStylesOnce(loginPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) {
      const from = location.state?.from;
      navigate(typeof from === "string" && from ? from : "/", { replace: true });
    }
  }, [loggedIn, location.state, navigate]);

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const inputs = form.querySelectorAll("input");
    const email = inputs?.[0]?.value?.trim() ?? "";
    const password = inputs?.[1]?.value?.trim() ?? "";
    const ok = loginMock(email, password);
    if (!ok) {
      alert("Preencha email e senha.");
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
      <LoginForm onSubmit={onSubmit} />
    </main>
  );
}
