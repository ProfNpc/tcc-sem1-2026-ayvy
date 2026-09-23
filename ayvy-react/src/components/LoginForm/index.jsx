import { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";

export default function LoginForm({ onSubmit, loading = false }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <h1>Login AYVY</h1>

      <div className="input-box">
        <input
          placeholder="E-mail"
          type="text"
          name="username"
          autoComplete="username"
          required
        />
        <i className="bx bxs-user" />
      </div>

      <div className="input-box input-box--password">
        <input
          placeholder="Senha"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setShowPassword((v) => !v)}
        >
          <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`} />
        </button>
      </div>

      <div className="remember-forgot">
        <label>
          <input type="checkbox" name="remember" />
          Lembrar Senha
        </label>
        <Link className="forgot-link" to="/esqueci-senha">
          Esqueci minha senha
        </Link>
      </div>

      <button type="submit" className="login" disabled={loading}>
        {loading ? "Entrando…" : "Login"}
      </button>

      <div className="resgister-link">
        <p>
          Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>

      <Link className="back-home" to="/">
        Voltar para a tela inicial
      </Link>
    </form>
  );
}
