/**
 * Seleciona usuário existente ou abre modal para criar novo.
 */
export default function UsuarioSelector({
  label,
  usuarios,
  value,
  onChange,
  onCreateNew,
  emptyHint,
}) {
  return (
    <div className="admin-crud-field admin-usuario-selector">
      <label>{label}</label>
      <div className="admin-usuario-selector-row">
        <select value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">Selecione um usuário…</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              #{u.id} — {u.nome} ({u.email})
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onCreateNew}>
          + Novo usuário
        </button>
      </div>
      {usuarios.length === 0 && emptyHint ? <p className="admin-crud-hint">{emptyHint}</p> : null}
    </div>
  );
}
