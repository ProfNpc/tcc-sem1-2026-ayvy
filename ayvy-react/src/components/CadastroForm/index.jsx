import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchAddressByCep } from "../../utils/viacep";
import "./style.css";

export default function CadastroForm({ onSubmit, loading = false }) {
  const [tipoLojista, setTipoLojista] = useState(false);
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  async function handleCepBlur() {
    const result = await fetchAddressByCep(cep);
    if (!result.ok) {
      if (result.error === "notfound") alert("CEP não encontrado!");
      if (result.error === "invalid") return;
      if (result.error === "network") alert("Erro ao buscar CEP. Tente novamente.");
      return;
    }
    setLogradouro(result.data.logradouro);
    setBairro(result.data.bairro);
    setCidade(result.data.cidade);
    setEstado(result.data.estado);
  }

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
          maxLength={8}
          required
          value={cep}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
          onBlur={handleCepBlur}
        />
      </div>

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

      <div className="input-box">
        <i className="bx bxs-lock-alt" />
        <input type="password" name="senha" placeholder="Crie uma Senha" required />
      </div>

      <div className="input-box">
        <i className="bx bxs-lock-open-alt" />
        <input type="password" name="senha2" placeholder="Confirme a Senha" required />
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
