import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CadastroForm from "../../components/CadastroForm";
import { useAuth } from "../../context/AuthContext";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { cadastroPageHrefs } from "../../utils/authPageStyles";
import "./style.css";

export default function Cadastro() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useExternalStylesOnce(cadastroPageHrefs);

  useEffect(() => {
    document.body.className = "";
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/", { replace: true });
  }, [loggedIn, navigate]);

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
      <CadastroForm
        onSubmit={() => {
          alert("Cadastro enviado (demonstração). Faça login para continuar.");
        }}
      />
    </main>
  );
}
