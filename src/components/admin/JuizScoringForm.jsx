import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Validação de range ─────────────────────────────────────────
function arredondado(val) {
  return Math.round(val * 10) / 10
}

function validarIncremento(val) {
  return Math.round(val * 10) === val * 10
}

// ─── Painel Recognized ──────────────────────────────────────────
function PainelRecognized({ value, onChange, disabled }) {
  const { acuracia = '', apresentacao = '' } = value || {}
  const total = acuracia !== '' && apresentacao !== '' ? arredondado(Number(acuracia) + Number(apresentacao)) : null

  const handleChange = (campo, val) => {
    const num = parseFloat(val)
    onChange({ ...value, [campo]: isNaN(num) ? '' : arredondado(num) })
  }

  return (
    <div className="scoring-panel">
      <h4>Recognized Poomsae</h4>
      <table className="scoring-table">
        <thead>
          <tr>
            <th>Componente</th>
            <th>Score</th>
            <th>Máximo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Acurácia</td>
            <td>
              <input
                type="number" step="0.1" min="0" max="4.0"
                value={acuracia}
                onChange={e => handleChange('acuracia', e.target.value)}
                disabled={disabled}
                className={acuracia !== '' && (acuracia < 0 || acuracia > 4.0) ? 'field-error' : ''}
              />
            </td>
            <td>4.0</td>
          </tr>
          <tr>
            <td>Apresentação</td>
            <td>
              <input
                type="number" step="0.1" min="0" max="6.0"
                value={apresentacao}
                onChange={e => handleChange('apresentacao', e.target.value)}
                disabled={disabled}
                className={apresentacao !== '' && (apresentacao < 0 || apresentacao > 6.0) ? 'field-error' : ''}
              />
            </td>
            <td>6.0</td>
          </tr>
          <tr className="score-total-row">
            <td><strong>Total</strong></td>
            <td><strong>{total !== null ? total.toFixed(1) : '—'}</strong></td>
            <td>10.0</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Painel Freestyle ───────────────────────────────────────────
function PainelFreestyle({ value, onChange, disabled }) {
  const { habilidade_tecnica = '', apresentacao = '' } = value || {}
  const total = habilidade_tecnica !== '' && apresentacao !== '' ? arredondado(Number(habilidade_tecnica) + Number(apresentacao)) : null

  const handleChange = (campo, val) => {
    const num = parseFloat(val)
    onChange({ ...value, [campo]: isNaN(num) ? '' : arredondado(num) })
  }

  return (
    <div className="scoring-panel">
      <h4>Freestyle Poomsae</h4>
      <table className="scoring-table">
        <thead>
          <tr>
            <th>Componente</th>
            <th>Score</th>
            <th>Máximo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Habilidade Técnica</td>
            <td>
              <input
                type="number" step="0.1" min="0" max="6.0"
                value={habilidade_tecnica}
                onChange={e => handleChange('habilidade_tecnica', e.target.value)}
                disabled={disabled}
                className={habilidade_tecnica !== '' && (habilidade_tecnica < 0 || habilidade_tecnica > 6.0) ? 'field-error' : ''}
              />
            </td>
            <td>6.0</td>
          </tr>
          <tr>
            <td>Apresentação</td>
            <td>
              <input
                type="number" step="0.1" min="0" max="4.0"
                value={apresentacao}
                onChange={e => handleChange('apresentacao', e.target.value)}
                disabled={disabled}
                className={apresentacao !== '' && (apresentacao < 0 || apresentacao > 4.0) ? 'field-error' : ''}
              />
            </td>
            <td>4.0</td>
          </tr>
          <tr className="score-total-row">
            <td><strong>Total</strong></td>
            <td><strong>{total !== null ? total.toFixed(1) : '—'}</strong></td>
            <td>10.0</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────
/**
 * JuizScoringForm — formulário de scoring para um juiz.
 * Props:
 *   matchId: string
 *   juizId: string
 *   numeroJuiz: number (1-7)
 *   tipoPoomsae: "Recognized" | "Freestyle"
 *   formaDesignada: string
 *   onScoreSubmetido: (score) => void
 */
export default function JuizScoringForm({ matchId, juizId, numeroJuiz, tipoPoomsae, formaDesignada, onScoreSubmetido }) {
  const [scoreRecognized, setScoreRecognized] = useState({ acuracia: '', apresentacao: '' })
  const [scoreFreestyle, setScoreFreestyle] = useState({ habilidade_tecnica: '', apresentacao: '' })
  const [submetido, setSubmetido] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const scoreAtual = tipoPoomsae === 'Recognized' ? scoreRecognized : scoreFreestyle

  const scoreValido = () => {
    if (tipoPoomsae === 'Recognized') {
      const { acuracia, apresentacao } = scoreRecognized
      return acuracia !== '' && apresentacao !== '' &&
        acuracia >= 0 && acuracia <= 4.0 &&
        apresentacao >= 0 && apresentacao <= 6.0 &&
        validarIncremento(acuracia) && validarIncremento(apresentacao)
    } else {
      const { habilidade_tecnica, apresentacao } = scoreFreestyle
      return habilidade_tecnica !== '' && apresentacao !== '' &&
        habilidade_tecnica >= 0 && habilidade_tecnica <= 6.0 &&
        apresentacao >= 0 && apresentacao <= 4.0 &&
        validarIncremento(habilidade_tecnica) && validarIncremento(apresentacao)
    }
  }

  const handleSubmit = async () => {
    if (!scoreValido()) return
    setEnviando(true)
    setErro(null)
    try {
      const payload = {
        match_id: matchId,
        juiz_id: juizId,
        numero_juiz: numeroJuiz,
        ...(tipoPoomsae === 'Recognized'
          ? { score_recognized: scoreRecognized }
          : { score_freestyle: scoreFreestyle }
        )
      }
      const resp = await fetch(`${API}/api/poomsae/matches/${matchId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Erro ao submeter score')
      }
      const score = await resp.json()
      setSubmetido(true)
      onScoreSubmetido?.(score)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (submetido) {
    return (
      <div className="scoring-submetido">
        <span>✓</span>
        <p>Score submetido com sucesso. Aguardando demais juízes.</p>
      </div>
    )
  }

  return (
    <div className="juiz-scoring-form">
      <div className="scoring-header">
        <h3>Juiz {numeroJuiz} — {tipoPoomsae}</h3>
        <div className="forma-badge">{formaDesignada}</div>
      </div>

      {erro && <div className="form-error">{erro}</div>}

      {tipoPoomsae === 'Recognized'
        ? <PainelRecognized value={scoreRecognized} onChange={setScoreRecognized} disabled={enviando} />
        : <PainelFreestyle value={scoreFreestyle} onChange={setScoreFreestyle} disabled={enviando} />
      }

      <div className="scoring-aviso">
        <small>Use incrementos de 0.1. Scores inválidos não podem ser submetidos.</small>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!scoreValido() || enviando}
        className="btn-primary btn-submit-score"
      >
        {enviando ? 'Enviando...' : 'Submeter Score'}
      </button>
    </div>
  )
}
