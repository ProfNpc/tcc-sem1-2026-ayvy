import { useEffect, useMemo, useState } from "react";
import { listUsuarios } from "../../../services/adminApi";
import { listTodosPedidos, getPedidoItens } from "../../../services/pedidosApi";
import "../admin-crud.css";
import "../style.css";
import "./relatorios.css";

const MESES = [
  { id: 0, label: "Janeiro", short: "Jan" },
  { id: 1, label: "Fevereiro", short: "Fev" },
  { id: 2, label: "Março", short: "Mar" },
  { id: 3, label: "Abril", short: "Abr" },
  { id: 4, label: "Maio", short: "Mai" },
  { id: 5, label: "Junho", short: "Jun" },
  { id: 6, label: "Julho", short: "Jul" },
  { id: 7, label: "Agosto", short: "Ago" },
  { id: 8, label: "Setembro", short: "Set" },
  { id: 9, label: "Outubro", short: "Out" },
  { id: 10, label: "Novembro", short: "Nov" },
  { id: 11, label: "Dezembro", short: "Dez" },
];

function formatBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function destaqueFromReceita(receita, max) {
  if (max <= 0) return "baixa";
  const ratio = receita / max;
  if (ratio >= 0.66) return "alta";
  if (ratio >= 0.33) return "media";
  return "baixa";
}

export default function AdminRelatorios() {
  const now = new Date();
  const [mesId, setMesId] = useState(now.getMonth());
  const [ano] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendasPorMes, setVendasPorMes] = useState({});
  const [novosUsuarios, setNovosUsuarios] = useState(
    MESES.map((m) => ({ mes: m.short, valor: 0 })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [pedidos, usuarios] = await Promise.all([
          listTodosPedidos(),
          listUsuarios(),
        ]);

        const map = {};
        for (const p of pedidos || []) {
          const d = p.criadoEm ? new Date(p.criadoEm) : null;
          if (!d || Number.isNaN(d.getTime()) || d.getFullYear() !== ano) continue;
          const m = d.getMonth();
          if (!map[m]) map[m] = {};

          let itens = [];
          try {
            itens = await getPedidoItens(p.id);
          } catch {
            itens = [];
          }

          const byLoja = {};
          for (const item of itens || []) {
            const nome = item.lojista?.nomeLoja || "Loja";
            const unit = Number(item.precoUnitario ?? item.produto?.preco ?? 0);
            const line = unit * (item.quantidade || 1);
            if (!byLoja[nome]) byLoja[nome] = { pedidos: new Set(), receita: 0 };
            byLoja[nome].pedidos.add(p.id);
            byLoja[nome].receita += line;
          }

          if (Object.keys(byLoja).length === 0) {
            const nome = "Marketplace";
            if (!byLoja[nome]) byLoja[nome] = { pedidos: new Set(), receita: 0 };
            byLoja[nome].pedidos.add(p.id);
            byLoja[nome].receita += Number(p.valorTotal) || 0;
          }

          for (const [loja, data] of Object.entries(byLoja)) {
            if (!map[m][loja]) map[m][loja] = { loja, pedidos: 0, receita: 0 };
            map[m][loja].pedidos += data.pedidos.size;
            map[m][loja].receita += data.receita;
          }
        }

        const vendasFinal = {};
        for (const [m, lojas] of Object.entries(map)) {
          const rows = Object.values(lojas);
          const maxR = Math.max(...rows.map((r) => r.receita), 1);
          vendasFinal[m] = rows
            .map((r) => ({
              ...r,
              destaque: destaqueFromReceita(r.receita, maxR),
            }))
            .sort((a, b) => b.receita - a.receita);
        }

        const novos = MESES.map((m) => ({ mes: m.short, valor: 0 }));
        for (const u of usuarios || []) {
          const d = u.criadoEm ? new Date(u.criadoEm) : null;
          if (!d || Number.isNaN(d.getTime()) || d.getFullYear() !== ano) continue;
          novos[d.getMonth()].valor += 1;
        }

        if (!cancelled) {
          setVendasPorMes(vendasFinal);
          setNovosUsuarios(novos);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro ao carregar relatórios");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ano]);

  const vendas = vendasPorMes[mesId] ?? [];
  const mesLabel = MESES.find((m) => m.id === mesId)?.label ?? String(mesId);

  const maxReceita = useMemo(
    () => Math.max(...vendas.map((v) => v.receita), 1),
    [vendas],
  );

  const maxUsuarios = useMemo(
    () => Math.max(...novosUsuarios.map((u) => u.valor), 1),
    [novosUsuarios],
  );

  const totalReceitaMes = vendas.reduce((acc, v) => acc + v.receita, 0);
  const totalPedidosMes = vendas.reduce((acc, v) => acc + v.pedidos, 0);
  const totalNovos = novosUsuarios.reduce((acc, u) => acc + u.valor, 0);
  const picoUsuarios = [...novosUsuarios].sort((a, b) => b.valor - a.valor)[0] || {
    mes: "—",
    valor: 0,
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Relatórios</h1>
          <p>
            Vendas por loja e novos usuários agregados da API ({ano}).
            {loading ? " Carregando…" : ""}
          </p>
          {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
        </div>
      </header>

      <section className="admin-metrics-row">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Receita em {mesLabel}</span>
          <strong className="admin-stat-value">{formatBRL(totalReceitaMes)}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pedidos em {mesLabel}</span>
          <strong className="admin-stat-value">{totalPedidosMes}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Novos usuários ({ano})</span>
          <strong className="admin-stat-value">{totalNovos}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Pico de cadastros</span>
          <strong className="admin-stat-value">
            {picoUsuarios.valor}
            <span className="admin-rel-stat-suffix"> em {picoUsuarios.mes}</span>
          </strong>
        </article>
      </section>

      <div className="admin-two-col admin-rel-cols">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Vendas por loja</h2>
            <label className="admin-rel-mes">
              <span className="admin-rel-mes-label">Mês</span>
              <select
                value={mesId}
                onChange={(e) => setMesId(Number(e.target.value))}
              >
                {MESES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="admin-rel-hint">
            Em <strong>{mesLabel}</strong>, compare quem vendeu mais.
          </p>

          {vendas.length === 0 ? (
            <p className="admin-rel-hint">Sem pedidos neste mês.</p>
          ) : (
            <ul className="admin-rel-vendas">
              {vendas.map((row) => (
                <li key={row.loja} className="admin-rel-venda-row">
                  <div className="admin-rel-venda-head">
                    <div>
                      <strong>{row.loja}</strong>
                      <span>
                        {row.pedidos} pedidos · {formatBRL(row.receita)}
                      </span>
                    </div>
                    <span className={`admin-rel-tag admin-rel-tag--${row.destaque}`}>
                      {row.destaque === "alta"
                        ? "Vendeu bem"
                        : row.destaque === "media"
                          ? "Na média"
                          : "Vendeu pouco"}
                    </span>
                  </div>
                  <div className="admin-rel-bar-track" aria-hidden>
                    <div
                      className={`admin-rel-bar-fill admin-rel-bar-fill--${row.destaque}`}
                      style={{
                        width: `${Math.round((row.receita / maxReceita) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Novos usuários por mês</h2>
          </div>

          <div
            className="admin-rel-chart"
            role="img"
            aria-label={`Gráfico de novos usuários em ${ano}`}
          >
            {novosUsuarios.map((item) => (
              <div key={item.mes} className="admin-rel-chart-col">
                <span className="admin-rel-chart-value">{item.valor}</span>
                <div className="admin-rel-chart-track">
                  <div
                    className="admin-rel-chart-bar"
                    style={{
                      height: `${Math.round((item.valor / maxUsuarios) * 100)}%`,
                    }}
                  />
                </div>
                <span className="admin-rel-chart-label">{item.mes}</span>
              </div>
            ))}
          </div>

          <ul className="admin-rel-crescimento">
            {novosUsuarios.map((item, i) => {
              const anterior = i > 0 ? novosUsuarios[i - 1].valor : null;
              const delta = anterior != null ? item.valor - anterior : null;
              return (
                <li key={item.mes}>
                  <span>{item.mes}</span>
                  <strong>{item.valor} novos</strong>
                  {delta != null ? (
                    <em className={delta >= 0 ? "is-up" : "is-down"}>
                      {delta >= 0 ? "+" : ""}
                      {delta} vs mês anterior
                    </em>
                  ) : (
                    <em>ponto de partida</em>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
