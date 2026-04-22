import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TIPOS_INSCRICAO = ['Individual', 'Dupla', 'Equipe']

function calcularIdade(dataNasc, anoRef) {
  if (!dataNasc || !anoRef) return null
  const ano = new Date(dataNasc).getFullYear()
  return anoRef - ano
}

function calcularDivisao(idade) {
  if (idade >= 12 && idade <= 14) return 'Cadet'
  if (idade >= 15 && idade <= 17) return 'Junior'
  if (idade >= 18 && idade <= 30) return 'Under 30'
  if (idade >= 31 && idade <= 40) return 'Under 40'
  if (idade >= 41 && idade <= 50) return 'Under 50'
  if (idade >= 51 && idade <= 60) return 'Under 60'
  if (idade >= 61 && idade <= 65) return 'Under 65'
  if (idade > 65) return 'Over 65'
  return null
}

/**
 * AtletaInscricaoForm — formulário de inscrição.
 * Props:
 *   campeonatoId: string
 *   anoCampeonato: number
 *   onInscricaoSalva: (inscricao) => void
 */
export default function AtletaInscricaoForm({ campeonatoId, anoCampeonato, onInscricaoSalva }) {
  const [tipoInscricao, setTipoInscricao] = useState('Individual')
  const [atletas, setAtletas] = useState([{ id: '', dataNasc: '', nome: '' }])
  const [divisaoCalculada, setDivisaoCalculada] = useState(null)
  const [categoria, setCategoria] = useState('')
  const [genero, setGenero] = useState('M')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const numAtletas = tipoInscricao === 'Individual' ? 1 : tipoInscricao === 'Dupla' ? 2 : 3

  // Ajustar slots de atletas conforme tipo
  useEffect(() => {
    setAtletas(Array(numAtletas).fill(null).map((_, i) => atletas[i] || { id: '', dataNasc: '', nome: '' }))
    setDivisaoCalculada(null)
  }, [tipoInscricao])

  // Recalcular divisão quando dados mudam (usa apenas primeiro atleta para cálculo)
  useEffect(() => {
    const primeiro = atletas[0]
    if (primeiro?.dataNasc && anoCampeonato) {
      const idade = calcularIdade(primeiro.dataNasc, anoCampeonato)
      const div = calcularDivisao(idade)
      setDivisaoCalculada(div)
      if (div) {
        setCategoria(`${div} ${genero} ${tipoInscricao}`)
      }
    }
  }, [atletas, anoCampeonato, genero, tipoInscricao])

  const handleAtletaChange = (index, field, value) => {
    setAtletas(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro(null)
    setSucesso(false)

    if (!divisaoCalculada) {
      setErro('Data de nascimento inválida ou divisão não calculável.')
      return
    }

    setEnviando(true)
    try {
      const payload = {
        campeonato_id: campeonatoId,
        tipo_inscricao: tipoInscricao,
        atletas_ids: atletas.map(a => a.id).filter(Boolean),
        categoria,
        divisao: divisaoCalculada,
        genero,
      }

      const resp = await fetch(`${API}/api/poomsae/inscricoes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Erro ao criar inscrição')
      }

      const inscricao = await resp.json()
      setSucesso(true)
      onInscricaoSalva?.(inscricao)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inscricao-form">
      <h3>Nova Inscrição</h3>

      {erro && <div className="form-error">{erro}</div>}
      {sucesso && <div className="form-success">Inscrição criada com sucesso!</div>}

      <div className="form-group">
        <label>Tipo de Inscrição</label>
        <select value={tipoInscricao} onChange={e => setTipoInscricao(e.target.value)}>
          {TIPOS_INSCRICAO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Gênero</label>
        <select value={genero} onChange={e => setGenero(e.target.value)}>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
      </div>

      {atletas.map((atleta, i) => (
        <fieldset key={i}>
          <legend>Atleta {i + 1}</legend>
          <div className="form-row">
            <div className="form-group">
              <label>ID do Atleta</label>
              <input
                value={atleta.id}
                onChange={e => handleAtletaChange(i, 'id', e.target.value)}
                required
                placeholder="MongoDB ObjectId"
              />
            </div>
            {i === 0 && (
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input
                  type="date"
                  value={atleta.dataNasc}
                  onChange={e => handleAtletaChange(i, 'dataNasc', e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </fieldset>
      ))}

      {divisaoCalculada && (
        <div className="divisao-info">
          <strong>Divisão calculada (Artigo 4.1 WT):</strong> {divisaoCalculada}
          <br />
          <strong>Categoria:</strong> {categoria}
          <br />
          <small>A divisão é baseada no ANO da competição ({anoCampeonato}), não na data exata.</small>
        </div>
      )}

      <div className="aviso-regras">
        <small>⚠ Cada atleta pode participar de no máximo 2 categorias (Artigo 5.2 WT)</small>
      </div>

      <button type="submit" disabled={enviando || !divisaoCalculada} className="btn-primary">
        {enviando ? 'Inscrevendo...' : 'Confirmar Inscrição'}
      </button>
    </form>
  )
}
