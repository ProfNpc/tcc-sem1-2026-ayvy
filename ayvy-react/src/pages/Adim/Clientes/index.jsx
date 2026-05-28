import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCliente, listClientes } from "../../../services/adminApi";
import "../admin-crud.css";

export default function AdminClientesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listClientes();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Falha ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row) {
    const nome = row.usuario?.nome || row.id;
    if (!window.confirm(`Excluir perfil de cliente "${nome}"?`)) return;
    try {
      await deleteCliente(row.id);
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Clientes</h1>
          <p>Perfis de comprador vinculados a usuários com papel cliente.</p>
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/clientes/novo" className="admin-btn admin-btn--primary">
            + Novo cliente
          </Link>
        </div>
      </header>

      {error ? <div className="admin-crud-alert admin-crud-alert--error">{error}</div> : null}

      <section className="admin-card">
        {loading ? (
          <p className="admin-crud-loading">Carregando…</p>
        ) : (
          <div className="admin-crud-table-wrap">
            <table className="admin-crud-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Nascimento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.usuario?.nome ?? "—"}</td>
                    <td>{row.usuario?.email ?? "—"}</td>
                    <td>{row.cpf}</td>
                    <td>{row.dataNascimento || "—"}</td>
                    <td>
                      <div className="admin-crud-actions">
                        <Link to={`/admin/clientes/${row.id}/editar`} className="admin-crud-btn-sm">
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
