const REQUISITOS = [
  { key: 'min_6_paises', label: 'Mínimo 6 países participantes', artigo: 'Artigo 7.1' },
  { key: 'min_6_atletas_por_divisao', label: 'Mínimo 6 atletas/equipes por divisão', artigo: 'Artigo 7.2' },
  { key: 'td_designado', label: 'Technical Delegate designado', artigo: 'Artigo 6' },
  { key: 'venue_conforme', label: 'Venue atende especificações (2000 assentos, 30×50m, 10m teto)', artigo: 'Artigo 3' },
  { key: 'juizes_qualificados', label: 'Mínimo 5 juízes qualificados (1 Referee Class 1 + 4 Judges)', artigo: 'Artigo 22' },
]

/**
 * ConformidadeChecklist — exibe checklist visual de conformidade WT.
 * Props:
 *   campeonato: objeto com campo "requisitos" (dict com booleans)
 *   relatorio: (opcional) resultado de /api/poomsae/campeonatos/{id}/conformidade
 *   onVerificar: () => void — callback para re-verificar
 */
export default function ConformidadeChecklist({ campeonato, relatorio, onVerificar }) {
  const requisitos = relatorio?.requisitos || campeonato?.requisitos || {}
  const pendencias = relatorio?.pendencias || []
  const conforme = relatorio?.conforme ?? Object.values(requisitos).every(Boolean)

  return (
    <div className="conformidade-checklist">
      <div className="conformidade-header">
        <h3>Conformidade WT Poomsae</h3>
        {onVerificar && (
          <button onClick={onVerificar} className="btn-secondary btn-sm">
            Verificar Novamente
          </button>
        )}
      </div>

      <div className={`conformidade-status ${conforme ? 'ok' : 'nok'}`}>
        {conforme ? '✓ Campeonato conforme com as regras WT' : '✗ Pendências de conformidade'}
      </div>

      <ul className="requisitos-list">
        {REQUISITOS.map(req => {
          const valor = requisitos[req.key]
          const checked = valor === true || valor?.atinge === true
          return (
            <li key={req.key} className={`requisito-item ${checked ? 'ok' : 'pendente'}`}>
              <span className="requisito-icon">{checked ? '✓' : '✗'}</span>
              <div>
                <strong>{req.label}</strong>
                <small> — {req.artigo}</small>
                {!checked && valor?.atual !== undefined && (
                  <div className="requisito-detalhe">
                    Atual: {valor.atual} / Mínimo: {valor.minimo}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {pendencias.length > 0 && (
        <div className="pendencias-list">
          <h4>Pendências</h4>
          <ul>
            {pendencias.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
