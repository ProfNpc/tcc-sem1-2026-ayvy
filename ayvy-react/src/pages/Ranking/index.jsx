import { RANKING_LOJAS_MOCK } from "../../utils/rankingMock";
import "./style.css";

export default function Ranking() {
  const filtrados = RANKING_LOJAS_MOCK.filter((l) => l.views > 10000).sort(
    (a, b) => b.views - a.views,
  );

  return (
    <main className="ranking-wrapper">
      <header className="ranking-header">
        <h1>Ranking de Visibilidade Mensal</h1>
        <p>Lojas parceiras com maior engajamento (+10k views).</p>
      </header>

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
              {filtrados.map((loja, i) => {
                const isTop = i < 3;
                const star = isTop ? <i className="fas fa-star star-icon" /> : null;
                return (
                  <tr key={loja.nome} className={isTop ? "row-highlight" : undefined}>
                    <td className="pos-num">{i + 1}º</td>
                    <td>
                      <div className="store-profile">
                        <img
                          src={loja.img || "https://via.placeholder.com/40"}
                          alt=""
                        />
                        <span style={{ fontWeight: 600 }}>{loja.nome}</span>
                      </div>
                    </td>
                    <td className="views-count">{loja.views.toLocaleString("pt-BR")}</td>
                    <td>
                      <div className="ranking-status-cell">
                        {star} <span className="status-pill">VERIFICADO</span>
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
