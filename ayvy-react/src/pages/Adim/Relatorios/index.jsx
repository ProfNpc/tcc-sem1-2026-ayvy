import { useMemo, useState } from "react";
import "../admin-crud.css";
import "../style.css";
import "./relatorios.css";

const MESES = [
  { id: "jan", label: "Janeiro" },
  { id: "fev", label: "Fevereiro" },
  { id: "mar", label: "Março" },
  { id: "abr", label: "Abril" },
  { id: "mai", label: "Maio" },
  { id: "jun", label: "Junho" },
];

/** Vendas por loja em cada mês — só layout / mock */
const VENDAS_POR_MES = {
  jan: [
    { loja: "ITB Moda", pedidos: 42, receita: 12840, destaque: "alta" },
    { loja: "Rafaele Fashion", pedidos: 31, receita: 9720, destaque: "media" },
    { loja: "Livre Store", pedidos: 8, receita: 1890, destaque: "baixa" },
  ],
  fev: [
    { loja: "ITB Moda", pedidos: 38, receita: 11200, destaque: "media" },
    { loja: "Rafaele Fashion", pedidos: 45, receita: 14150, destaque: "alta" },
    { loja: "Livre Store", pedidos: 12, receita: 2650, destaque: "baixa" },
  ],
  mar: [
    { loja: "ITB Moda", pedidos: 51, receita: 15680, destaque: "alta" },
    { loja: "Rafaele Fashion", pedidos: 40, receita: 12300, destaque: "media" },
    { loja: "Livre Store", pedidos: 18, receita: 4100, destaque: "media" },
  ],
  abr: [
    { loja: "ITB Moda", pedidos: 47, receita: 13990, destaque: "alta" },
    { loja: "Rafaele Fashion", pedidos: 36, receita: 10840, destaque: "media" },
    { loja: "Livre Store", pedidos: 22, receita: 5280, destaque: "media" },
  ],
  mai: [
    { loja: "ITB Moda", pedidos: 55, receita: 17200, destaque: "alta" },
    { loja: "Rafaele Fashion", pedidos: 49, receita: 15890, destaque: "alta" },
    { loja: "Livre Store", pedidos: 27, receita: 6400, destaque: "media" },
  ],
  jun: [
    { loja: "ITB Moda", pedidos: 62, receita: 19850, destaque: "alta" },
    { loja: "Rafaele Fashion", pedidos: 58, receita: 18420, destaque: "alta" },
    { loja: "Livre Store", pedidos: 35, receita: 8120, destaque: "media" },
  ],
};

/** Novos usuários (assinantes) por mês — curva de crescimento */
const NOVOS_USUARIOS = [
  { mes: "Jan", valor: 40 },
  { mes: "Fev", valor: 55 },
  { mes: "Mar", valor: 72 },
  { mes: "Abr", valor: 98 },
  { mes: "Mai", valor: 130 },
  { mes: "Jun", valor: 175 },
];

function formatBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminRelatorios() {
  const [mesId, setMesId] = useState("jun");

  const vendas = VENDAS_POR_MES[mesId] ?? [];
  const mesLabel = MESES.find((m) => m.id === mesId)?.label ?? mesId;

  const maxReceita = useMemo(
    () => Math.max(...vendas.map((v) => v.receita), 1),
    [vendas],
  );

  const maxUsuarios = useMemo(
    () => Math.max(...NOVOS_USUARIOS.map((u) => u.valor), 1),
    [],
  );

  const totalReceitaMes = vendas.reduce((acc, v) => acc + v.receita, 0);
  const totalPedidosMes = vendas.reduce((acc, v) => acc + v.pedidos, 0);
  const totalNovos = NOVOS_USUARIOS.reduce((acc, u) => acc + u.valor, 0);
  const picoUsuarios = NOVOS_USUARIOS[NOVOS_USUARIOS.length - 1];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Relatórios</h1>
          <p>
            Visão de vendas por loja e crescimento de novos usuários. Layout ilustrativo —
            números de exemplo, sem backend.
          </p>
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
          <span className="admin-stat-label">Novos usuários (semestre)</span>
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
              <select value={mesId} onChange={(e) => setMesId(e.target.value)}>
                {MESES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="admin-rel-hint">
            Em <strong>{mesLabel}</strong>, compare quem vendeu mais e quem ficou atrás.
          </p>

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
                    style={{ width: `${Math.round((row.receita / maxReceita) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Novos usuários por mês</h2>
          </div>

          <p className="admin-rel-hint">
            Crescimento de cadastros: de <strong>40 em janeiro</strong> até{" "}
            <strong>175 em junho</strong>.
          </p>

          <div
            className="admin-rel-chart"
            role="img"
            aria-label="Gráfico de novos usuários de janeiro a junho"
          >
            {NOVOS_USUARIOS.map((item) => (
              <div key={item.mes} className="admin-rel-chart-col">
                <span className="admin-rel-chart-value">{item.valor}</span>
                <div className="admin-rel-chart-track">
                  <div
                    className="admin-rel-chart-bar"
                    style={{ height: `${Math.round((item.valor / maxUsuarios) * 100)}%` }}
                  />
                </div>
                <span className="admin-rel-chart-label">{item.mes}</span>
              </div>
            ))}
          </div>

          <ul className="admin-rel-crescimento">
            {NOVOS_USUARIOS.map((item, i) => {
              const anterior = i > 0 ? NOVOS_USUARIOS[i - 1].valor : null;
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
