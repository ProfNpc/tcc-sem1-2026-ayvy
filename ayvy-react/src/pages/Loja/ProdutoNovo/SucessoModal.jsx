/**
 * Janela "Produto cadastrado com sucesso!" (ou "Rascunho salvo") com botões para ver o produto ou
 * voltar para a loja. Substitui o alert do navegador.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * Janela mostrada depois de publicar ou salvar rascunho (no lugar do alert do navegador).
 * `acoes`: [{ to, label, icone, primaria }] — cada botão leva para uma tela da loja.
 */
export default function SucessoModal({ titulo, mensagem, imagem, acoes, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pn-sucesso-overlay" role="presentation">
      <div className="pn-sucesso" role="dialog" aria-modal="true" aria-labelledby="pn-sucesso-titulo">
        <span className="pn-sucesso__icone" aria-hidden>
          <i className="fas fa-check" />
        </span>
        {imagem ? <img className="pn-sucesso__foto" src={imagem} alt="" /> : null}
        <h2 id="pn-sucesso-titulo">{titulo}</h2>
        {mensagem ? <p>{mensagem}</p> : null}
        <div className="pn-sucesso__acoes">
          {acoes.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              replace
              className={`produto-novo-btn ${a.primaria ? "produto-novo-btn--primary" : "produto-novo-btn--ghost"}`}
            >
              {a.icone ? <i className={`fas ${a.icone}`} aria-hidden /> : null} {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
