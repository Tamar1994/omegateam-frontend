import { useState } from 'react'

const TIPOS_POOMSAE = [
  { value: 'Recognized', label: 'Recognized' },
  { value: 'Freestyle', label: 'Freestyle' },
  { value: 'Mixed', label: 'Mixed (Recognized + Freestyle)' },
]

const SISTEMAS = [
  { value: 'Single Elimination', label: 'Single Elimination' },
  { value: 'Round Robin', label: 'Round Robin' },
  { value: 'Cut Off', label: 'Cut Off' },
  { value: 'Combination', label: 'Combination' },
]

const camposVenue = [
  { name: 'capacidade_minima_assentos', label: 'Capacidade de Assentos', min: 2000, unit: 'assentos' },
  { name: 'piso_minimo_m2', label: 'Área do Piso', min: 1500, unit: 'm²' },
  { name: 'altura_minima_teto', label: 'Altura do Teto', min: 10, unit: 'm' },
  { name: 'iluminacao_minima_lux', label: 'Iluminação', min: 1500, unit: 'lux' },
]

export default function CampeonatoPoomsaeForm({ onSalvar, campeonato }) {
  const [form, setForm] = useState(campeonato || {
    nome: '',
    cidade: '',
    pais: '',
    data_inicio: '',
    data_fim: '',
    tipo: 'Recognized',
    sistema_competicao: 'Single Elimination',
    technical_delegate_email: '',
    venue_specs: {
      capacidade_minima_assentos: 2000,
      piso_minimo_m2: 1500,
      altura_minima_teto: 10,
      iluminacao_minima_lux: 1500,
    },
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleVenueChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      venue_specs: { ...prev.venue_specs, [name]: Number(value) }
    }))
  }

  const getVenueWarning = (campo) => {
    const val = form.venue_specs?.[campo.name]
    if (val < campo.min) {
      return `Abaixo do mínimo WT: ${campo.min} ${campo.unit}`
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await onSalvar(form)
    } catch (err) {
      setErro(err.message || 'Erro ao salvar campeonato')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="poomsae-camp-form">
      <h2>{campeonato ? 'Editar Campeonato' : 'Novo Campeonato de Poomsae'}</h2>

      {erro && <div className="form-error">{erro}</div>}

      {/* Dados básicos */}
      <fieldset>
        <legend>Informações Gerais</legend>
        <div className="form-group">
          <label>Nome do Campeonato *</label>
          <input name="nome" value={form.nome} onChange={handleChange} required minLength={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Cidade *</label>
            <input name="cidade" value={form.cidade} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>País *</label>
            <input name="pais" value={form.pais} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Data Início *</label>
            <input type="date" name="data_inicio" value={form.data_inicio} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Data Fim *</label>
            <input type="date" name="data_fim" value={form.data_fim} onChange={handleChange} required />
          </div>
        </div>
      </fieldset>

      {/* Tipo e Sistema */}
      <fieldset>
        <legend>Formato da Competição</legend>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Poomsae *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              {TIPOS_POOMSAE.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Sistema de Competição *</label>
            <select name="sistema_competicao" value={form.sistema_competicao} onChange={handleChange}>
              {SISTEMAS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Email do Technical Delegate *</label>
          <input
            type="email"
            name="technical_delegate_email"
            value={form.technical_delegate_email}
            onChange={handleChange}
            required
            placeholder="technical.delegate@email.com"
          />
          <small>Technical Delegate é exigido pela WT (Artigo 6)</small>
        </div>
      </fieldset>

      {/* Venue */}
      <fieldset>
        <legend>Especificações do Venue (Artigo 3 WT)</legend>
        {camposVenue.map(campo => {
          const warning = getVenueWarning(campo)
          return (
            <div key={campo.name} className="form-group">
              <label>{campo.label} (mín: {campo.min} {campo.unit})</label>
              <input
                type="number"
                name={campo.name}
                value={form.venue_specs?.[campo.name] || ''}
                onChange={handleVenueChange}
                min={0}
              />
              {warning && <span className="field-warning">⚠ {warning}</span>}
            </div>
          )
        })}
      </fieldset>

      <button type="submit" disabled={enviando} className="btn-primary">
        {enviando ? 'Salvando...' : campeonato ? 'Atualizar' : 'Criar Campeonato'}
      </button>
    </form>
  )
}
