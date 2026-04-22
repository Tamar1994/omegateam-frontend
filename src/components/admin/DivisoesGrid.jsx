import { useState, useEffect } from 'react'

const DIVISOES = [
  { key: 'Cadet', label: 'Cadet', faixa: '12-14 anos' },
  { key: 'Junior', label: 'Junior', faixa: '15-17 anos' },
  { key: 'Under 30', label: 'Under 30', faixa: '18-30 anos' },
  { key: 'Under 40', label: 'Under 40', faixa: '31-40 anos' },
  { key: 'Under 50', label: 'Under 50', faixa: '41-50 anos' },
  { key: 'Under 60', label: 'Under 60', faixa: '51-60 anos' },
  { key: 'Under 65', label: 'Under 65', faixa: '61-65 anos' },
  { key: 'Over 65', label: 'Over 65', faixa: '65+ anos' },
]

const GENEROS = ['M', 'F']
const TIPOS = ['Individual', 'Dupla', 'Equipe']

function getStatus(count) {
  if (count === 0) return { label: 'Vazio', color: '#aaa' }
  if (count < 6) return { label: `${count}/6 (abaixo do mín.)`, color: '#e67e22' }
  return { label: `${count} inscritos`, color: '#27ae60' }
}

/**
 * DivisoesGrid — exibe grade de todas as divisões com contagem de inscritos.
 * Props:
 *   campeonatoId: string
 *   inscricoes: array de inscrições com campo "categoria" e "divisao"
 *   onCategoriaClick: (divisao, genero, tipo) => void
 */
export default function DivisoesGrid({ campeonatoId, inscricoes = [], onCategoriaClick }) {
  const [visao, setVisao] = useState('Individual')

  const getCategoriaKey = (divisao, genero, tipo) =>
    `${divisao}_${genero}_${tipo}`

  const contarInscritos = (divisao, genero, tipo) => {
    const key = getCategoriaKey(divisao, genero, tipo)
    return inscricoes.filter(i =>
      i.categoria?.includes(divisao) &&
      i.categoria?.includes(genero) &&
      i.tipo_inscricao === tipo
    ).length
  }

  return (
    <div className="divisoes-grid">
      <div className="divisoes-header">
        <h3>Divisões — {campeonatoId}</h3>
        <div className="visao-tabs">
          {TIPOS.map(t => (
            <button
              key={t}
              className={visao === t ? 'active' : ''}
              onClick={() => setVisao(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="divisoes-legenda">
        <span style={{ color: '#27ae60' }}>● ≥6 inscritos (OK)</span>
        <span style={{ color: '#e67e22' }}>● &lt;6 inscritos (insuficiente)</span>
        <span style={{ color: '#aaa' }}>● Sem inscritos</span>
      </div>

      <table className="divisoes-table">
        <thead>
          <tr>
            <th>Divisão / Idade</th>
            {GENEROS.map(g => (
              <th key={g}>{g === 'M' ? 'Masculino' : 'Feminino'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIVISOES.map(div => (
            <tr key={div.key}>
              <td>
                <strong>{div.label}</strong>
                <br />
                <small>{div.faixa}</small>
              </td>
              {GENEROS.map(genero => {
                const count = contarInscritos(div.key, genero, visao)
                const status = getStatus(count)
                return (
                  <td
                    key={genero}
                    onClick={() => onCategoriaClick?.(div.key, genero, visao)}
                    style={{ cursor: onCategoriaClick ? 'pointer' : 'default', borderLeft: `3px solid ${status.color}` }}
                  >
                    <span style={{ color: status.color }}>{status.label}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
