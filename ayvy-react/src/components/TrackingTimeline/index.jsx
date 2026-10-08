import { useEffect, useRef, useState } from "react";
import "./style.css";

const ETAPAS_ENVIO = [
  { key: "recebido", label: "Pedido recebido" },
  { key: "preparando", label: "Preparando" },
  { key: "despachado", label: "Despachado" },
  { key: "coletado", label: "Coletado" },
  { key: "em_rota", label: "Em rota de transporte" },
  { key: "entregue", label: "Entregue" },
];

const IDX_DESPACHADO = 2;

/* Mesmos tempos do backend (Pedido.SEGUNDOS_TRAJETO / SEGUNDOS_PARADA). */
const SEGUNDOS_TRAJETO = 120;
const SEGUNDOS_PARADA = 180;

const LEGENDA = {
  aguardando: "Aguardando a loja confirmar o recebimento do pedido.",
  recebido: "A loja recebeu o pedido e logo vai começar a preparar.",
  preparando: "A loja está preparando o pedido.",
  despachado: "Pedido despachado. Aguardando a coleta.",
  coletado: "Pacote coletado. Logo ele sai para entrega.",
  em_rota: "Pacote em rota de transporte até o endereço de entrega.",
  entregue: "Pacote entregue no endereço.",
};

const LEGENDA_TRAJETO = {
  coletado: "Pacote a caminho da coleta…",
  em_rota: "Pacote saindo do centro de distribuição…",
  entregue: "Pacote saiu para entrega. Chegando ao destino…",
};

/**
 * Posição do caminhão após o despacho.
 * Retorna o índice da etapa de onde ele saiu (ou onde está parado) e o progresso (0..1) até a próxima.
 */
function posicaoCaminhao(segundos) {
  let restante = segundos;
  let idx = IDX_DESPACHADO;
  while (idx < ETAPAS_ENVIO.length - 1) {
    if (restante < SEGUNDOS_TRAJETO) {
      return { idx, progresso: restante / SEGUNDOS_TRAJETO, andando: true };
    }
    restante -= SEGUNDOS_TRAJETO;
    idx += 1;
    if (idx === ETAPAS_ENVIO.length - 1) break;
    if (restante < SEGUNDOS_PARADA) {
      return { idx, progresso: 0, andando: false };
    }
    restante -= SEGUNDOS_PARADA;
  }
  return { idx: ETAPAS_ENVIO.length - 1, progresso: 0, andando: false };
}

/**
 * @param {string} etapa etapaEnvio vinda da API
 * @param {number|null} envioIniciadoEm timestamp (ms, relógio local) do despacho; ativa a animação do caminhão
 * @param {() => void} [onEtapaChange] chamado quando o caminhão chega numa nova etapa
 */
export default function TrackingTimeline({ etapa, envioIniciadoEm = null, onEtapaChange, legenda = true }) {
  const emTransito =
    envioIniciadoEm != null && ["despachado", "coletado", "em_rota"].includes(etapa);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!emTransito) return undefined;
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [emTransito]);

  const segundos = emTransito ? Math.max(0, (agora - envioIniciadoEm) / 1000) : 0;
  const caminhao = emTransito ? posicaoCaminhao(segundos) : null;

  const atual = caminhao ? caminhao.idx : ETAPAS_ENVIO.findIndex((e) => e.key === etapa);
  const etapaAtual = ETAPAS_ENVIO[atual]?.key;

  const ultimaEtapaAvisada = useRef(etapaAtual);
  useEffect(() => {
    if (!caminhao || ultimaEtapaAvisada.current === etapaAtual) return;
    ultimaEtapaAvisada.current = etapaAtual;
    onEtapaChange?.();
  }, [caminhao, etapaAtual, onEtapaChange]);

  if (etapa === "cancelado") {
    return (
      <p className="trk-cancelado">
        <i className="fas fa-ban" aria-hidden /> Pedido cancelado
      </p>
    );
  }

  const total = ETAPAS_ENVIO.length;
  const andando = caminhao?.andando;
  const posicao = caminhao ? caminhao.idx + caminhao.progresso : atual;
  const centro = (i) => ((i + 0.5) / total) * 100;

  let textoLegenda = LEGENDA[etapaAtual] || LEGENDA[etapa];
  if (andando) textoLegenda = LEGENDA_TRAJETO[ETAPAS_ENVIO[caminhao.idx + 1]?.key] || textoLegenda;

  return (
    <div className="trk">
      <div className="trk-track">
        <ol className="trk-line">
          {ETAPAS_ENVIO.map((e, idx) => {
            const estado = idx < atual ? "is-done" : idx === atual ? "is-current" : "";
            return (
              <li key={e.key} className={estado}>
                <span className="trk-dot">
                  {idx === atual && !caminhao ? (
                    <i className="fas fa-truck" aria-hidden />
                  ) : idx <= atual ? (
                    <i className="fas fa-check" aria-hidden />
                  ) : null}
                </span>
                <span className="trk-label">{e.label}</span>
              </li>
            );
          })}
        </ol>

        {caminhao ? (
          <>
            {andando ? (
              <span
                className="trk-progress"
                style={{
                  left: `${centro(caminhao.idx)}%`,
                  width: `${(caminhao.progresso / total) * 100}%`,
                }}
                aria-hidden
              />
            ) : null}
            <span
              className={`trk-truck${andando ? " is-moving" : ""}`}
              style={{ left: `${centro(posicao)}%` }}
              aria-hidden
            >
              <i className="fas fa-truck" />
            </span>
          </>
        ) : null}
      </div>
      {legenda && textoLegenda ? <p className="trk-legenda">{textoLegenda}</p> : null}
    </div>
  );
}
