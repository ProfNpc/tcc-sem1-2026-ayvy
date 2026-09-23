import { useState } from "react";
import { Link } from "react-router-dom";
import useCepLookup from "../../hooks/useCepLookup";
import "./style.css";

export default function CadastroForm({ onSubmit, loading = false }) {
  const [tipoLojista, setTipoLojista] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showSenha2, setShowSenha2] = useState(false);
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const { formatAndLookup, cepLoading, cepError, cepHint } = useCepLookup((data) => {
    setLogradouro(data.logradouro);
    setBairro(data.bairro);
    setCidade(data.cidade);
    setEstado(data.estado);
  });

  return (
    <form onSubmit={onSubmit}>
      <h1>Cadastro AYVY</h1>

      <p className="cadastro-intro-tipo">O que você deseja ser?</p>
      <div className="user-type-selection">
        <div className="radio-card">
          <input
            type="radio"
            id="cliente"
            name="tipo"
            value="cliente"
            defaultChecked
            onChange={() => setTipoLojista(false)}
          />
          <label htmlFor="cliente">Sou Cliente</label>
        </div>
        <div className="radio-card">
          <input
            type="radio"
            id="lojista"
            name="tipo"
            value="lojista"
            onChange={() => setTipoLojista(true)}
          />
          <label htmlFor="lojista">Sou Lojista</label>
        </div>
      </div>

      <div className="input-box">
        <i className="bx bxs-user" />
        <input type="text" name="nome" placeholder="Nome Completo" required />
      </div>

      <span className="label-pequena">Data de Nascimento</span>
      <div className="input-box">
        <i className="bx bxs-calendar" />
        <input type="date" name="dataNascimento" required={!tipoLojista} />
      </div>

      <div className="input-box">
        <i className="bx bxs-envelope" />
        <input type="email" name="email" placeholder="E-mail" required />
      </div>

      <div className="input-box">
        <i className="bx bxs-id-card" />
        <input
          type="text"
          name="documento"
          id="documento"
          placeholder={tipoLojista ? "CNPJ da Empresa" : "CPF"}
          maxLength={tipoLojista ? 14 : 11}
          required
        />
      </div>

      <div className="input-box">
        <i className="bx bxs-map-pin" />
        <input
          type="text"
          name="cep"
          id="cep"
          placeholder="CEP"
          maxLength={9}
          required
          inputMode="numeric"
          autoComplete="postal-code"
          value={cep}
          onChange={(e) => {
            const { formatted, digits } = formatAndLookup(e.target.value);
            setCep(formatted || digits);
          }}
          onBlur={() => formatAndLookup(cep)}
        />
      </div>
      {cepLoading ? (
        <p className="cadastro-cep-hint">Buscando endereço…</p>
      ) : null}
      {cepError ? <p className="cadastro-cep-hint cadastro-cep-err">{cepError}</p> : null}
      {!cepError && cepHint ? <p className="cadastro-cep-hint">{cepHint}</p> : null}

      <div className="input-box">
        <i className="bx bxs-direction-left" />
        <input
          type="text"
          name="logradouro"
          id="logradouro"
          placeholder="Logradouro"
          required
          value={logradouro}
          onChange={(e) => setLogradouro(e.target.value)}
        />
      </div>

      <div className="input-box">
        <i className="bx bxs-navigation" />
        <input
          type="text"
          name="numero"
          id="numero"
          placeholder="Número"
          required
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
      </div>

      <div className="input-box">
        <i className="bx bxs-building-house" />
        <input
          type="text"
          name="bairro"
          id="bairro"
          placeholder="Bairro"
          required
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
        />
      </div>

      <div className="input-box">
        <i className="bx bxs-city" />
        <input
          type="text"
          name="cidade"
          id="cidade"
          placeholder="Cidade"
          required
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
        />
      </div>

      <div className="input-box">
        <i className="bx bxs-map-alt" />
        <input
          type="text"
          name="estado"
          id="estado"
          placeholder="Estado (Ex: SP)"
          maxLength={2}
          required
          value={estado}
          onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
        />
      </div>

      <div className="input-box input-box--password">
        <i className="bx bxs-lock-alt" aria-hidden />
        <input
          type={showSenha ? "text" : "password"}
          name="senha"
          placeholder="Crie uma Senha"
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setShowSenha((v) => !v)}
        >
          <i className={`bx ${showSenha ? "bx-hide" : "bx-show"}`} />
        </button>
      </div>

      <div className="input-box input-box--password">
        <i className="bx bxs-lock-open-alt" aria-hidden />
        <input
          type={showSenha2 ? "text" : "password"}
          name="senha2"
          placeholder="Confirme a Senha"
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={showSenha2 ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
          onClick={() => setShowSenha2((v) => !v)}
        >
          <i className={`bx ${showSenha2 ? "bx-hide" : "bx-show"}`} />
        </button>
      </div>

      <div className="remember-forgot">
        <label>
          <input type="checkbox" /> Lembrar Senha
        </label>
      </div>

      <button type="submit" className="btn-register" disabled={loading}>
        {loading ? "Cadastrando…" : "Finalizar Cadastro"}
      </button>

      <div className="login-link">
        <p>
          Já tem uma conta? <Link to="/login">Faça Login</Link>
        </p>
      </div>

      <Link className="back-home" to="/">
        Voltar para a tela inicial
      </Link>
    </form>
  );
}
