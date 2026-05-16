import { Link } from "react-router-dom";
import "./style.css";

export default function LoginForm({ onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <h1>Login AYVY</h1>

      <div className="input-box">
        <input placeholder="Usuário" type="email" name="email" />
        <i className="bx bxs-user" />
      </div>

      <div className="input-box">
        <input placeholder="Senha" type="password" name="password" />
        <i className="bx bxs-lock-alt" />
      </div>

      <div className="remember-forgot">
        <label>
          <input type="checkbox" />
          Lembrar Senha
        </label>
        <Link className="forgot-link" to="/esqueci-senha">
          Esqueci minha senha
        </Link>
      </div>

      <button type="submit" className="login">
        Login
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
