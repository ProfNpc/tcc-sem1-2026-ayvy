import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteUsuario, listUsuarios } from "../../../services/adminApi";
import { resolveImageUrl } from "../../../utils/imageUrl";
import "../admin-crud.css";

const STATUS_FILTERS = ["ativo", "inativo", "bloqueado"];

export default function AdminUsuariosList() {
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
      // GET /usuarios — busca todos os usuários para preencher a tabela
      const data = await listUsuarios();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Falha ao carregar usuários. Verifique se a API está em http://localhost:8082");
    } finally {
      setLoading(false);
    }
  }, []);

  // Ao abrir a página, carrega a lista uma vez
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e) {
      // Fecha o menu Buscar se o clique foi fora do botão/menu
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  async function handleDelete(row) {
    if (!window.confirm(`Excluir usuário "${row.nome}"?`)) return;
    try {
      // DELETE /usuarios/:id — remove o usuário no back
      await deleteUsuario(row.id);
      // Recarrega a tabela após excluir
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  function handleFilterSelect(status) {
    // Guarda o status escolhido no Buscar ("" = Todos)
    setStatusFilter(status);
    setFilterOpen(false);
  }

  const filteredItems = useMemo(() => {
    // Sem filtro: mostra todos os itens que vieram da API
    if (!statusFilter) return items;
    // Com filtro: mantém só quem tem o mesmo status no banco
    return items.filter((row) => row.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Usuários</h1>
          <p>Identidade da plataforma (login, papel e status).</p>
        </div>
        <div className="admin-page-actions">
          {/* Abre Form.jsx — Salvar lá chama POST /usuarios */}
          <Link to="/admin/usuarios/novo" className="admin-btn admin-btn--primary">
            + Novo usuário
          </Link>
        </div>
      </header>

      {error ? <div className="admin-crud-alert admin-crud-alert--error">{error}</div> : null}

      <section className="admin-card">
        <div className="admin-crud-toolbar">
          <span>{filteredItems.length} registro(s)</span>
          {/* Botão Atualizar chama load() de novo (GET /usuarios) */}
          <button type="button" className="admin-crud-btn-sm" onClick={load} disabled={loading}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="admin-crud-loading">Carregando…</p>
        ) : (
          <div className={`admin-crud-table-wrap${filterOpen ? " admin-crud-table-wrap--menu-open" : ""}`}>
            <table className="admin-crud-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Ações</th>
                  <th scope="col" className="admin-crud-buscar-cell">
                    <div className="admin-crud-buscar" ref={filterRef}>
                      <button
                        type="button"
                        className="admin-crud-buscar__trigger"
                        // Abre ou fecha o menu de filtro por status
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
                            {/* Limpa o filtro e mostra todos */}
                            <button type="button" onClick={() => handleFilterSelect("")}>
                              Todos
                            </button>
                          </li>
                          {STATUS_FILTERS.map((status) => (
                            <li key={status} role="option" aria-selected={statusFilter === status}>
                              {/* Aplica filtro local por status */}
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
                {/* Só renderiza linhas que passaram no filtro do Buscar */}
                {filteredItems.map((row) => (
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
                        {/* Abre Form.jsx — GET /usuarios/:id e Salvar → PUT /usuarios/:id */}
                        <Link to={`/admin/usuarios/${row.id}/editar`} className="admin-crud-btn-sm">
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="admin-crud-btn-sm admin-crud-btn-sm--danger"
                          // onClick → handleDelete → DELETE /usuarios/:id
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
