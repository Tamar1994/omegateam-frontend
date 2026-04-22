/**
 * ScoringCalculator — exibe a matemática completa do cálculo WT.
 * Mostra os 7 scores, destaca max/min removidos, mostra média dos restantes.
 * 
 * Props:
 *   resultado: objeto resultado do /api/poomsae/matches/{id}/calcular
 *   tipoPoomsae: "Recognized" | "Freestyle"
 */
function ComponenteDetalhe({ titulo, detalhe, corMax = '#e74c3c', corMin = '#e74c3c', corValido = '#27ae60' }) {
  if (!detalhe) return null

  const { scores_recebidos, score_max, score_min, scores_validos, media } = detalhe

  return (
    <div className="componente-detalhe">
      <h4>{titulo}</h4>
      <div className="scores-linha">
        {scores_recebidos.map((s, i) => {
          const isMax = s === score_max && !scores_validos.includes(s)
          const isMin = s === score_min && !scores_validos.includes(s)
          const removido = isMax || isMin
          return (
            <span
              key={i}
              className={`score-chip ${removido ? 'removido' : 'valido'}`}
              style={{
                background: removido ? '#fde8e8' : '#e8fde8',
                color: removido ? corMax : corValido,
                border: `1px solid ${removido ? corMax : corValido}`,
                textDecoration: removido ? 'line-through' : 'none',
              }}
              title={isMax ? 'Máximo removido' : isMin ? 'Mínimo removido' : 'Usado na média'}
            >
              {s.toFixed(1)}
            </span>
          )
        })}
      </div>
      <div className="media-resultado">
        Média dos {scores_validos.length} restantes: <strong>{media.toFixed(2)}</strong>
      </div>
    </div>
  )
}

export default function ScoringCalculator({ resultado, tipoPoomsae, deducoes }) {
  if (!resultado) {
    return <div className="scoring-placeholder">Aguardando cálculo de pontuação...</div>
  }

  if (resultado.desqualificado) {
    return (
      <div className="scoring-dq">
        <h3>🚫 Atleta Desqualificado</h3>
        <p>Pontuação final: 0.0</p>
      </div>
    )
  }

  const {
    detalhe_acuracia,
    detalhe_apresentacao,
    detalhe_habilidade_tecnica,
    pontuacao_base,
    total_deducoes,
    pontuacao_final,
    soma_total_scores,
    num_juizes_computados,
  } = resultado

  return (
    <div className="scoring-calculator">
      <div className="scoring-calc-header">
        <h3>Cálculo — {tipoPoomsae}</h3>
        <span className="juizes-badge">{num_juizes_computados} juízes</span>
      </div>

      <div className="scoring-legenda">
        <span style={{ color: '#e74c3c' }}>■ Máx/Mín removido</span>
        <span style={{ color: '#27ae60' }}>■ Usado na média</span>
      </div>

      {/* Recognized */}
      {tipoPoomsae === 'Recognized' && (
        <>
          <ComponenteDetalhe titulo="Acurácia (máx 4.0)" detalhe={detalhe_acuracia} />
          <ComponenteDetalhe titulo="Apresentação (máx 6.0)" detalhe={detalhe_apresentacao} />
        </>
      )}

      {/* Freestyle */}
      {tipoPoomsae === 'Freestyle' && (
        <>
          <ComponenteDetalhe titulo="Habilidade Técnica (máx 6.0)" detalhe={detalhe_habilidade_tecnica} />
          <ComponenteDetalhe titulo="Apresentação (máx 4.0)" detalhe={detalhe_apresentacao} />
        </>
      )}

      {/* Resumo */}
      <div className="scoring-resumo">
        <div className="resumo-linha">
          <span>Pontuação Base</span>
          <span>{pontuacao_base?.toFixed(2)}</span>
        </div>
        {total_deducoes > 0 && (
          <div className="resumo-linha deducao">
            <span>Deduções</span>
            <span>−{total_deducoes.toFixed(1)}</span>
          </div>
        )}
        {deducoes?.saiu_zona && <div className="deducao-item">• Saiu da zona: −0.3 (Art. 11.2c)</div>}
        {deducoes?.fora_do_tempo && <div className="deducao-item">• Fora do tempo: −0.3 (Art. 11.2a)</div>}
        {deducoes?.num_kyeong_go > 0 && (
          <div className="deducao-item">• Kyeong-go: {deducoes.num_kyeong_go}× (2 = DQ — Art. 14.2)</div>
        )}
        <div className="resumo-linha total-final">
          <span><strong>Pontuação Final</strong></span>
          <span><strong>{pontuacao_final?.toFixed(2)}</strong></span>
        </div>
        <div className="resumo-linha soma-total">
          <span><small>Soma total (desempate c4)</small></span>
          <span><small>{soma_total_scores?.toFixed(2)}</small></span>
        </div>
      </div>
    </div>
  )
}
