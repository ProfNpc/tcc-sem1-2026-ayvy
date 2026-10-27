import { useMemo, useState } from "react";
import { montarArvoreCategorias } from "../../../utils/categoriaArvore";

/**
 * Escolha da categoria em dois passos (principal → subcategoria), com botões
 * no mesmo estilo dos tamanhos. `value` é o id salvo no produto.
 */
export default function CategoriaPicker({ categorias, value, onChange }) {
  const arvore = useMemo(() => montarArvoreCategorias(categorias), [categorias]);
  const [principalEscolhida, setPrincipalEscolhida] = useState(null);

  const idAtual = value ? Number(value) : null;
  const principalDoValor =
    arvore.find((p) => p.id === idAtual || p.filhas.some((f) => f.id === idAtual)) || null;
  const principal =
    arvore.find((p) => p.id === principalEscolhida) || principalDoValor || null;
  const sub = principal?.filhas.find((f) => f.id === idAtual) || null;

  function escolherPrincipal(p) {
    setPrincipalEscolhida(p.id);
    if (principalDoValor?.id !== p.id) {
      onChange(p.filhas.length === 0 ? String(p.id) : "");
    }
  }

  if (arvore.length === 0) {
    return <p className="produto-novo-hint">Carregando categorias…</p>;
  }

  return (
    <div className="produto-novo-cat">
      <div className="produto-novo-chips-group">
        <span className="produto-novo-chips-label">Categoria principal *</span>
        <div className="produto-novo-chips">
          {arvore.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`produto-novo-chip${principal?.id === p.id ? " is-on" : ""}`}
              onClick={() => escolherPrincipal(p)}
            >
              {p.icone ? <i className={`fas ${p.icone}`} aria-hidden /> : null} {p.nome}
            </button>
          ))}
        </div>
      </div>

      {principal && principal.filhas.length > 0 ? (
        <div className="produto-novo-chips-group">
          <span className="produto-novo-chips-label">Subcategoria em {principal.nome} *</span>
          <div className="produto-novo-chips">
            {principal.filhas.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`produto-novo-chip${sub?.id === f.id ? " is-on" : ""}`}
                onClick={() => onChange(String(f.id))}
              >
                {f.nome}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className={`produto-novo-cat-resumo${sub || (principal && principal.filhas.length === 0 && idAtual) ? " is-ok" : ""}`}>
        {sub ? (
          <>
            <i className="fas fa-check-circle" aria-hidden /> {principal.nome} › {sub.nome}
          </>
        ) : principal && principal.filhas.length === 0 && idAtual ? (
          <>
            <i className="fas fa-check-circle" aria-hidden /> {principal.nome}
          </>
        ) : principal ? (
          "Agora escolha a subcategoria."
        ) : (
          "Escolha a categoria principal e depois a subcategoria do produto."
        )}
      </p>
    </div>
  );
}

/** true quando o produto já tem uma categoria final (subcategoria, ou principal sem subcategorias). */
// eslint-disable-next-line react-refresh/only-export-components
export function categoriaCompleta(categorias, value) {
  if (!value) return false;
  const id = Number(value);
  const arvore = montarArvoreCategorias(categorias);
  return arvore.some(
    (p) => p.filhas.some((f) => f.id === id) || (p.id === id && p.filhas.length === 0),
  );
}
