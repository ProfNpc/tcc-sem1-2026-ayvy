import { montarArvoreCategorias } from "../../utils/categoriaArvore";

/** <option>s de categoria agrupadas por categoria principal, para usar dentro de um <select>. */
export default function CategoriaOptions({ categorias }) {
  return montarArvoreCategorias(categorias).map((principal) =>
    principal.filhas.length > 0 ? (
      <optgroup key={principal.id} label={principal.nome}>
        <option value={principal.id}>{principal.nome} (geral)</option>
        {principal.filhas.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.nome}
          </option>
        ))}
      </optgroup>
    ) : (
      <option key={principal.id} value={principal.id}>
        {principal.nome}
      </option>
    ),
  );
}
