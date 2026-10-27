/**
 * Recuperar senha sem login (/esqueci-senha): 1) e-mail + canal (E-mail/SMS) → 2) código + nova senha → 3) pronto.
 * Chamadas: services/senhaApi.js. Sem e-mail/SMS configurado, o código aparece no console do Spring.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { redefinirSenhaComCodigo, solicitarCodigoSenha } from "../../services/senhaApi";
import { esqueciSenhaPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

const ESPERA_REENVIO = 60;
const SENHA_MINIMA = 6;

export default function EsqueciSenha() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [etapa, setEtapa] = useState("email");
  const [email, setEmail] = useState("");
  const [canal, setCanal] = useState("email");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  useExternalStylesOnce(esqueciSenhaPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/perfil", { replace: true });
  }, [loggedIn, navigate]);

  useEffect(() => {
    if (esperaReenvio <= 0) return undefined;
    const t = setTimeout(() => setEsperaReenvio((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [esperaReenvio]);

  async function pedirCodigo() {
    setEnviando(true);
    setErro("");
    try {
      await solicitarCodigoSenha(email.trim(), canal);
      setEtapa("codigo");
      setInfo(
        canal === "sms"
          ? `Se houver uma conta com ${email.trim()}, enviamos um código de 6 dígitos por SMS para o telefone cadastrado. Se a conta não tiver telefone, o código vai para o e-mail.`
          : `Se houver uma conta com ${email.trim()}, enviamos um código de 6 dígitos. Confira também a caixa de spam.`,
      );
      setEsperaReenvio(ESPERA_REENVIO);
    } catch (e) {
      setErro(e.message || "Não foi possível enviar o código.");
    } finally {
      setEnviando(false);
    }
  }

  function onSubmitEmail(e) {
    e.preventDefault();
    pedirCodigo();
  }

  async function onSubmitNovaSenha(e) {
    e.preventDefault();
    setErro("");
    if (codigo.length !== 6) {
      setErro("Digite o código de 6 dígitos que chegou no seu e-mail.");
      return;
    }
    if (novaSenha.trim().length < SENHA_MINIMA) {
      setErro(`A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      await redefinirSenhaComCodigo({ email: email.trim(), codigo, novaSenha });
      setEtapa("pronto");
    } catch (e) {
      setErro(e.message || "Não foi possível alterar a senha.");
    } finally {
      setEnviando(false);
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
      {etapa === "email" ? (
        <form onSubmit={onSubmitEmail}>
          <h1>Recuperar senha</h1>
          <p className="instrucao">
            Informe o e-mail da sua conta e escolha como quer receber o código para criar uma nova
            senha.
          </p>

          <div className="input-box">
            <input
              placeholder="Seu e-mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (erro) setErro("");
              }}
            />
            <i className="bx bxs-envelope" />
          </div>

          <fieldset className="rec-canal">
            <legend>Receber o código por</legend>
            <label className={canal === "email" ? "is-active" : ""}>
              <input
                type="radio"
                name="canal"
                value="email"
                checked={canal === "email"}
                onChange={() => setCanal("email")}
              />
              <i className="bx bxs-envelope" aria-hidden /> E-mail
            </label>
            <label className={canal === "sms" ? "is-active" : ""}>
              <input
                type="radio"
                name="canal"
                value="sms"
                checked={canal === "sms"}
                onChange={() => setCanal("sms")}
              />
              <i className="bx bxs-message-dots" aria-hidden /> SMS
            </label>
          </fieldset>

          {erro ? <p className="rec-erro">{erro}</p> : null}

          <button type="submit" className="btn-save" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar código"}
          </button>

          <Link className="back-login" to="/login">
            Voltar para o Login
          </Link>
        </form>
      ) : null}

      {etapa === "codigo" ? (
        <form onSubmit={onSubmitNovaSenha}>
          <h1>Criar nova senha</h1>
          {info ? <p className="instrucao">{info}</p> : null}

          <div className="input-box">
            <input
              placeholder="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="rec-codigo"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (erro) setErro("");
              }}
              autoFocus
            />
            <i className="bx bxs-key" />
          </div>

          <div className="input-box">
            <input
              placeholder="Nova senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(e.target.value);
                if (erro) setErro("");
              }}
            />
            <button
              type="button"
              className="rec-olho"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
            >
              <i className={`bx ${mostrarSenha ? "bxs-hide" : "bxs-show"}`} />
            </button>
          </div>

          <div className="input-box">
            <input
              placeholder="Confirmar nova senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => {
                setConfirmacao(e.target.value);
                if (erro) setErro("");
              }}
            />
            <i className="bx bxs-lock-alt" />
          </div>

          {erro ? <p className="rec-erro">{erro}</p> : null}

          <button type="submit" className="btn-save" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar nova senha"}
          </button>

          <p className="rec-reenviar">
            Não recebeu?{" "}
            {esperaReenvio > 0 ? (
              <span>Reenviar em {esperaReenvio}s</span>
            ) : (
              <button type="button" onClick={pedirCodigo} disabled={enviando}>
                Reenviar código
              </button>
            )}
            {" · "}
            <button
              type="button"
              onClick={() => {
                setEtapa("email");
                setCodigo("");
                setErro("");
              }}
            >
              Trocar e-mail
            </button>
          </p>

          <Link className="back-login" to="/login">
            Voltar para o Login
          </Link>
        </form>
      ) : null}

      {etapa === "pronto" ? (
        <div>
          <h1>Senha alterada!</h1>
          <p className="instrucao">
            Sua senha foi atualizada. Agora é só entrar com o e-mail <strong>{email.trim()}</strong> e a
            nova senha.
          </p>
          <Link className="btn-save rec-btn-link" to="/login">
            Ir para o Login
          </Link>
        </div>
      ) : null}
    </main>
  );
}
