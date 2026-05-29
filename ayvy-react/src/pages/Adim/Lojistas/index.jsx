import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteLojista, listLojistas } from "../../../services/adminApi";
import { notifyAdminMetricsChanged } from "../../../utils/adminMetrics";
import { resolveImageUrl } from "../../../utils/imageUrl";
import "../admin-crud.css";

export default function AdminLojistasList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listLojistas();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Falha ao carregar lojistas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row) {
    if (!window.confirm(`Excluir loja "${row.nomeLoja}"?`)) return;
    try {
      await deleteLojista(row.id);
      notifyAdminMetricsChanged();
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Lojistas</h1>
          <p>Lojas vinculadas a usuários com papel lojista.</p>
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/lojistas/novo" className="admin-btn admin-btn--primary">
            + Nova loja
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
                  <th>Loja</th>
                  <th>Slug</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {row.logoUrl ? (
                        <img
                          src={resolveImageUrl(row.logoUrl)}
                          alt=""
                          width={28}
                          height={28}
                          style={{ borderRadius: 6, marginRight: 8, verticalAlign: "middle" }}
                        />
                      ) : null}
                      {row.nomeLoja}
                    </td>
                    <td>{row.slug}</td>
                    <td>{row.usuario?.nome ?? "—"}</td>
                    <td>
                      <span className={`admin-badge--status ${row.status}`}>{row.status}</span>
                    </td>
                    <td>
                      <div className="admin-crud-actions">
                        <Link to={`/admin/lojistas/${row.id}/editar`} className="admin-crud-btn-sm">
                          Editar
                        </Link>
                        <Link to={`/loja/${row.slug}`} className="admin-crud-btn-sm">
                          Ver loja
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
