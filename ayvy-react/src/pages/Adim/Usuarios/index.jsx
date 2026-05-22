import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteUsuario, listUsuarios } from "../../../services/adminApi";
import { resolveImageUrl } from "../../../utils/imageUrl";
import "../admin-crud.css";

export default function AdminUsuariosList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsuarios();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Falha ao carregar usuários. Verifique se a API está em http://localhost:8082");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row) {
    if (!window.confirm(`Excluir usuário "${row.nome}"?`)) return;
    try {
      await deleteUsuario(row.id);
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Usuários</h1>
          <p>Identidade da plataforma (login, papel e status).</p>
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/usuarios/novo" className="admin-btn admin-btn--primary">
            + Novo usuário
          </Link>
        </div>
      </header>

      {error ? <div className="admin-crud-alert admin-crud-alert--error">{error}</div> : null}

      <section className="admin-card">
        <div className="admin-crud-toolbar">
          <span>{items.length} registro(s)</span>
          <button type="button" className="admin-crud-btn-sm" onClick={load} disabled={loading}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="admin-crud-loading">Carregando…</p>
        ) : (
          <div className="admin-crud-table-wrap">
            <table className="admin-crud-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {row.avatarUrl ? (
                        <img
                          src={resolveImageUrl(row.avatarUrl)}
                          alt=""
                          width={28}
                          height={28}
                          style={{ borderRadius: "50%", verticalAlign: "middle", marginRight: 8 }}
                        />
                      ) : null}
                      {row.nome}
                    </td>
                    <td>{row.email}</td>
                    <td>{row.papel}</td>
                    <td>
                      <span className={`admin-badge--status ${row.status}`}>{row.status}</span>
                    </td>
                    <td>
                      <div className="admin-crud-actions">
                        <Link to={`/admin/usuarios/${row.id}/editar`} className="admin-crud-btn-sm">
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="admin-crud-btn-sm admin-crud-btn-sm--danger"
                          onClick={() => handleDelete(row)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
