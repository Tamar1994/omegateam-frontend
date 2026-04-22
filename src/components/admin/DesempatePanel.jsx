import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CRITERIO_LABELS = {
  'Maior Apresentação': 'Critério 1: Maior Apresentação',
  'Maior Hab. Técnica': 'Critério 2: Maior Habilidade Técnica',
  'Maior Score Freestyle': 'Critério 3: Maior Score Freestyle',
  'Maior Soma Total': 'Critério 4: Maior Soma Total (incl. max/min)',
  'Rematch Necessário': 'Critério 5: REMATCH',
}

/**
 * DesempatePanel — resolve e exibe resultado de desempate.
 * Props:
 *   matchId1, matchId2: string
 *   resultado1, resultado2: objeto resultado de cada match
 *   tipoPoomsae: "Recognized" | "Freestyle" | "Mixed"
 *   onRematch: (rematchData) => void
 */
export default function DesempatePanel({ matchId1, matchId2, resultado1, resultado2, tipoPoomsae, onRematch }) {
  const [resolucao, setResolucao] = useState(null)
  const [resolvendo, setResolvendo] = useState(false)
  const [criandoRematch, setCriandoRematch] = useState(false)
  const [erro, setErro] = useState(null)

  const handleResolver = async () => {
    setResolvendo(true)
    setErro(null)
    try {
      const resp = await fetch(`${API}/api/poomsae/desempate/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id_1: matchId1,
          match_id_2: matchId2,
          tipo_competicao: tipoPoomsae,
        }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Erro ao resolver desempate')
      }
      setResolucao(await resp.json())
    } catch (err) {
      setErro(err.message)
    } finally {
      setResolvendo(false)
    }
  }

  const handleCriarRematch = async () => {
    setCriandoRematch(true)
    try {
      const resp = await fetch(`${API}/api/poomsae/desempate/rematch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id_1: matchId1, match_id_2: matchId2, tipo_competicao: tipoPoomsae }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Erro ao criar rematch')
      }
      const data = await resp.json()
      onRematch?.(data)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCriandoRematch(false)
    }
  }

  return (
    <div className="desempate-panel">
      <h3>Resolução de Desempate — {tipoPoomsae}</h3>

      {/* Comparativo */}
      <div className="desempate-comparativo">
        <div className={`match-card ${resolucao?.vencedor_match_id === matchId1 ? 'vencedor' : ''}`}>
          <h4>Match 1</h4>
          <div className="pontuacao-final">{resultado1?.pontuacao_final?.toFixed(2) ?? '—'}</div>
          {resultado1?.detalhe_apresentacao && (
            <div><small>Apresentação: {resultado1.detalhe_apresentacao.media?.toFixed(2)}</small></div>
          )}
          {resultado1?.detalhe_habilidade_tecnica && (
            <div><small>Hab. Técnica: {resultado1.detalhe_habilidade_tecnica.media?.toFixed(2)}</small></div>
          )}
          <div><small>Soma total: {resultado1?.soma_total_scores?.toFixed(2)}</small></div>
        </div>

        <div className="versus">VS</div>

        <div className={`match-card ${resolucao?.vencedor_match_id === matchId2 ? 'vencedor' : ''}`}>
          <h4>Match 2</h4>
          <div className="pontuacao-final">{resultado2?.pontuacao_final?.toFixed(2) ?? '—'}</div>
          {resultado2?.detalhe_apresentacao && (
            <div><small>Apresentação: {resultado2.detalhe_apresentacao.media?.toFixed(2)}</small></div>
          )}
          {resultado2?.detalhe_habilidade_tecnica && (
            <div><small>Hab. Técnica: {resultado2.detalhe_habilidade_tecnica.media?.toFixed(2)}</small></div>
          )}
          <div><small>Soma total: {resultado2?.soma_total_scores?.toFixed(2)}</small></div>
        </div>
      </div>

      {erro && <div className="form-error">{erro}</div>}

      {!resolucao && (
        <button onClick={handleResolver} disabled={resolvendo} className="btn-primary">
          {resolvendo ? 'Resolvendo...' : 'Resolver Desempate'}
        </button>
      )}

      {resolucao && (
        <div className={`resolucao-resultado ${resolucao.precisa_rematch ? 'rematch' : 'resolvido'}`}>
          <h4>{CRITERIO_LABELS[resolucao.criterio_aplicado] || resolucao.criterio_aplicado}</h4>
          <p>{resolucao.detalhes}</p>

          {resolucao.precisa_rematch ? (
            <div className="rematch-aviso">
              <p>⚠ Todos os critérios esgotados. Um rematch é necessário.</p>
              <p><small>O Technical Delegate deve designar a forma para o rematch.</small></p>
              <button onClick={handleCriarRematch} disabled={criandoRematch} className="btn-warning">
                {criandoRematch ? 'Criando...' : 'Criar Rematch'}
              </button>
            </div>
          ) : (
            <div className="vencedor-anuncio">
              ✓ Vencedor: Match {resolucao.vencedor_match_id === matchId1 ? '1' : '2'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
