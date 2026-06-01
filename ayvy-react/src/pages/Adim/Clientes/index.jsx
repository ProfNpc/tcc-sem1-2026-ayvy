import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCliente, listClientes } from "../../../services/adminApi";
import { notifyAdminMetricsChanged } from "../../../utils/adminMetrics";
import "../admin-crud.css";

const STATUS_FILTERS = ["ativo", "inativo", "bloqueado"];

export default function AdminClientesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

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

  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  async function handleDelete(row) {
    const nome = row.usuario?.nome || row.id;
    if (!window.confirm(`Excluir perfil de cliente "${nome}"?`)) return;
    try {
      await deleteCliente(row.id);
      notifyAdminMetricsChanged();
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  function handleFilterSelect(status) {
    setStatusFilter(status);
    setFilterOpen(false);
  }

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((row) => row.usuario?.status === statusFilter);
  }, [items, statusFilter]);

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
          <div className={`admin-crud-table-wrap${filterOpen ? " admin-crud-table-wrap--menu-open" : ""}`}>
            <table className="admin-crud-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Nascimento</th>
                  <th>Ações</th>
                  <th scope="col" className="admin-crud-buscar-cell">
                    <div className="admin-crud-buscar" ref={filterRef}>
                      <button
                        type="button"
                        className="admin-crud-buscar__trigger"
                        onClick={() => setFilterOpen((open) => !open)}
                        aria-expanded={filterOpen}
                        aria-haspopup="listbox"
                      >
                        Buscar
                        <span className="admin-crud-buscar__arrow" aria-hidden="true">
                          ▼
                        </span>
                      </button>
                      {filterOpen ? (
                        <ul className="admin-crud-buscar__menu" role="listbox">
                          <li role="option" aria-selected={statusFilter === ""}>
                            <button type="button" onClick={() => handleFilterSelect("")}>
                              Todos
                            </button>
                          </li>
                          {STATUS_FILTERS.map((status) => (
                            <li key={status} role="option" aria-selected={statusFilter === status}>
                              <button type="button" onClick={() => handleFilterSelect(status)}>
                                {status}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row) => (
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
                    <td aria-hidden="true" />
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
