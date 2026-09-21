import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listLojistasApi, listProdutosApi } from "../../services/shopApi";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./style.css";

export default function Ranking() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [lojistas, produtos] = await Promise.all([
          listLojistasApi(),
          listProdutosApi(),
        ]);
        const viewsByLoja = {};
        for (const p of produtos || []) {
          const id = p?.lojista?.id;
          if (id == null) continue;
          viewsByLoja[id] = (viewsByLoja[id] || 0) + (Number(p.visualizacoesTotal) || 0);
        }
        const rows = (lojistas || [])
          .map((l) => ({
            id: l.id,
            nome: l.nomeLoja || l.slug,
            slug: String(l.slug || "")
              .toLowerCase()
              .replace(/-/g, "_"),
            img: resolveImageUrl(l.logoUrl) || "https://via.placeholder.com/40",
            views: viewsByLoja[l.id] || 0,
            verificado: String(l.statusLoja || l.status || "").toLowerCase() === "aprovado",
          }))
          .sort((a, b) => b.views - a.views);

        if (!cancelled) setLinhas(rows);
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar ranking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="ranking-wrapper">
      <header className="ranking-header">
        <h1>Ranking de Visibilidade</h1>
        <p>Lojas ordenadas pelas visualizações somadas dos produtos (API).</p>
      </header>

      {loading ? <p style={{ textAlign: "center" }}>Carregando…</p> : null}
      {error ? <p style={{ textAlign: "center", color: "#b00020" }}>{error}</p> : null}

      {!loading && linhas.length === 0 ? (
        <p style={{ textAlign: "center" }}>
          Ainda sem dados. Cadastre lojas e produtos no admin.{" "}
          <Link to="/">Voltar</Link>
        </p>
      ) : null}

      <div className="table-container">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Perfil Comercial</th>
                <th>Visualizações</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="ranking-body">
              {linhas.map((loja, i) => {
                const isTop = i < 3 && loja.views > 0;
                const star = isTop ? <i className="fas fa-star star-icon" /> : null;
                return (
                  <tr key={loja.id} className={isTop ? "row-highlight" : undefined}>
                    <td className="pos-num">{i + 1}º</td>
                    <td>
                      <div className="store-profile">
                        <img src={loja.img} alt="" />
                        {loja.slug ? (
                          <Link to={`/loja/${loja.slug}`} style={{ fontWeight: 600 }}>
                            {loja.nome}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{loja.nome}</span>
                        )}
                      </div>
                    </td>
                    <td className="views-count">{loja.views.toLocaleString("pt-BR")}</td>
                    <td>
                      <div className="ranking-status-cell">
                        {star}{" "}
                        <span className="status-pill">
                          {loja.verificado ? "VERIFICADO" : "PENDENTE"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
