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

  useExternalStylesOnce(esqueciSenhaPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/", { replace: true });
  }, [loggedIn, navigate]);

  function onSubmit(e) {
    e.preventDefault();
    alert("Senha atualizada (demonstração).");
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
        <h1>Nova Senha</h1>
        <p className="instrucao">Crie uma senha forte para proteger sua conta na AYVY.</p>

        <div className="input-box">
          <input placeholder="Senha Nova" type="password" required />
          <i className="bx bxs-lock-alt" />
        </div>

        <div className="input-box">
          <input placeholder="Repetir Senha Nova" type="password" required />
          <i className="bx bxs-lock-open-alt" />
        </div>

        <div className="remember-forgot">
          <label>
            <input type="checkbox" />
            Lembrar Nova Senha
          </label>
        </div>

        <button type="submit" className="btn-save">
          Salvar Alterações
        </button>

        <Link className="back-login" to="/login">
          Voltar para o Login
        </Link>
      </form>
    </main>
  );
}
