import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * ScoresMonitor — painel em tempo real dos scores de um match.
 * Mostra quantos juízes submeteram, quais estão pendentes, e o resultado final.
 * Props:
 *   matchId: string
 *   autoRefresh: boolean (padrão true)
 *   intervalMs: number (padrão 5000)
 */
export default function ScoresMonitor({ matchId, autoRefresh = true, intervalMs = 5000 }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarScores = async () => {
    try {
      const resp = await fetch(`${API}/api/poomsae/matches/${matchId}/scores`)
      if (!resp.ok) throw new Error('Falha ao buscar scores')
      setDados(await resp.json())
      setErro(null)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarScores()
    if (!autoRefresh) return
    const timer = setInterval(buscarScores, intervalMs)
    return () => clearInterval(timer)
  }, [matchId])

  if (carregando) return <div className="monitor-loading">Carregando scores...</div>
  if (erro) return <div className="form-error">{erro}</div>
  if (!dados) return null

  const { total_juizes, scores_recebidos, pendentes, scores } = dados
  const progresso = total_juizes > 0 ? Math.round((scores_recebidos / total_juizes) * 100) : 0
  const completo = scores_recebidos >= total_juizes

  return (
    <div className="scores-monitor">
      <div className="monitor-header">
        <h4>Scores do Match</h4>
        <span className={`status-badge ${completo ? 'completo' : 'pendente'}`}>
          {completo ? '✓ Todos submetidos' : `${scores_recebidos}/${total_juizes} recebidos`}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="progresso-bar-container">
        <div
          className="progresso-bar"
          style={{ width: `${progresso}%`, background: completo ? '#27ae60' : '#3498db' }}
        />
      </div>

      {/* Scores recebidos */}
      {scores.length > 0 && (
        <div className="scores-lista">
          <h5>Recebidos</h5>
          {scores.map((s, i) => {
            const scoreRec = s.score_recognized
            const scoreFs = s.score_freestyle
            const total = scoreRec
              ? (scoreRec.acuracia + scoreRec.apresentacao).toFixed(1)
              : scoreFs
              ? (scoreFs.habilidade_tecnica + scoreFs.apresentacao).toFixed(1)
              : '—'
            return (
              <div key={i} className="score-item recebido">
                <span>Juiz {s.numero_juiz}</span>
                <span className="score-valor">{total}</span>
                {scoreRec && (
                  <span className="score-detalhe">
                    Ac: {scoreRec.acuracia} | Ap: {scoreRec.apresentacao}
                  </span>
                )}
                {scoreFs && (
                  <span className="score-detalhe">
                    HT: {scoreFs.habilidade_tecnica} | Ap: {scoreFs.apresentacao}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="pendentes-lista">
          <h5>Aguardando</h5>
          {pendentes.map((juizId, i) => (
            <div key={i} className="score-item pendente">
              <span>Juiz ID: {juizId.slice(-6)}</span>
              <span className="status-dot pendente" />
            </div>
          ))}
        </div>
      )}

      {autoRefresh && !completo && (
        <div className="auto-refresh-info">
          <small>Atualizando a cada {intervalMs / 1000}s...</small>
        </div>
      )}
    </div>
  )
}
