import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CadastroForm from "../../components/CadastroForm";
import { useAuth } from "../../context/AuthContext";
import {
  criarCliente,
  criarEndereco,
  criarLojista,
  criarUsuario,
} from "../../services/authApi";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { cadastroPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

export default function Cadastro() {
  const { loggedIn, login } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useExternalStylesOnce(cadastroPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/", { replace: true });
  }, [loggedIn, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const tipo = String(fd.get("tipo") || "cliente");
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const senha = String(fd.get("senha") || "");
    const senha2 = String(fd.get("senha2") || "");
    const documento = String(fd.get("documento") || "").replace(/\D/g, "");
    const dataNascimento = String(fd.get("dataNascimento") || "").trim() || null;
    const cep = String(fd.get("cep") || "").replace(/\D/g, "");
    const logradouro = String(fd.get("logradouro") || "").trim();
    const numero = String(fd.get("numero") || "").trim();
    const bairro = String(fd.get("bairro") || "").trim();
    const cidade = String(fd.get("cidade") || "").trim();
    const uf = String(fd.get("estado") || "").trim().toUpperCase();

    if (senha !== senha2) {
      setError("As senhas não coincidem.");
      return;
    }
    if (tipo === "cliente" && documento.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      return;
    }
    if (tipo === "lojista" && documento.length !== 14) {
      setError("CNPJ deve ter 14 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const usuario = await criarUsuario({
        nome,
        email,
        senha,
        papel: tipo,
        status: "ativo",
      });

      if (tipo === "cliente") {
        await criarCliente({
          usuarioId: usuario.id,
          cpf: documento,
          dataNascimento,
        });
      } else {
        const nomeLoja = nome;
        const slug = slugify(nomeLoja) || `loja_${usuario.id}`;
        await criarLojista({
          usuarioId: usuario.id,
          nomeLoja,
          slug,
          cnpj: documento,
          descricao: "",
        });
      }

      if (cep.length === 8 && logradouro && numero && bairro && cidade && uf) {
        try {
          await criarEndereco({
            usuario: { id: usuario.id },
            logradouro,
            numero,
            bairro,
            cidade,
            uf,
            cep,
            principal: true,
            apelido: "Principal",
          });
        } catch {
          /* endereço opcional no fluxo se falhar */
        }
      }

      await login(email, senha);
      navigate(tipo === "lojista" ? "/" : "/", { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  const animStyle = visible
    ? { opacity: 1, transform: "translateY(0)" }
    : { opacity: 0, transform: "translateY(15px)" };

  return (
    <main
      className="container"
      style={{
        display: "block",
        ...animStyle,
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      {error ? (
        <p style={{ color: "#b00020", textAlign: "center", marginBottom: "0.75rem" }}>{error}</p>
      ) : null}
      <CadastroForm onSubmit={handleSubmit} loading={loading} />
    </main>
  );
}
