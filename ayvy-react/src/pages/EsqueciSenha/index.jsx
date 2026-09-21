import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { esqueciSenhaPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

export default function EsqueciSenha() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useExternalStylesOnce(esqueciSenhaPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/perfil", { replace: true });
  }, [loggedIn, navigate]);

  function onSubmit(e) {
    e.preventDefault();
    setDone(true);
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
      <form onSubmit={onSubmit}>
        <h1>Recuperar senha</h1>
        <p className="instrucao">
          Ainda não há e-mail de reset no back. Informe seu e-mail para orientação, ou
          entre na conta e altere a senha em <strong>Perfil</strong>.
        </p>

        {done ? (
          <p style={{ textAlign: "center", marginBottom: "1rem" }}>
            Se a conta <strong>{email}</strong> existir, faça login e use o campo{" "}
            <em>Nova senha</em> no perfil. Em produção, aqui entraria o envio de link.
          </p>
        ) : (
          <div className="input-box">
            <input
              placeholder="Seu e-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <i className="bx bxs-envelope" />
          </div>
        )}

        {!done ? (
          <button type="submit" className="btn-save">
            Continuar
          </button>
        ) : null}

        <Link className="back-login" to="/login">
          Voltar para o Login
        </Link>
        {loggedIn ? null : (
          <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
            Já lembrou? <Link to="/login">Entrar</Link> e trocar em{" "}
            <Link to="/perfil">Perfil</Link>.
          </p>
        )}
      </form>
    </main>
  );
}
