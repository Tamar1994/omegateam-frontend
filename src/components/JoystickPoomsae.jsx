import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * JOYSTICK POOMSAE WT — Sistema de notas conforme regras WT (Artigo 13)
 *
 * Cada juiz submete individualmente:
 *   Recognized: Acurácia (0–4.0) + Apresentação (0–6.0) = 10.0
 *   Freestyle:  Hab. Técnica (0–6.0) + Apresentação (0–4.0) = 10.0
 *
 * O sistema aguarda todos os juízes, remove o maior e o menor score
 * por componente e calcula a média dos restantes.
 */
export function JoystickPoomsae({ luta, usuario, ws, t, campId }) {

  // ─── Judge identification ────────────────────────────────────────
  const [numeroJuiz, setNumeroJuiz] = useState(null);
  const [loadingJuiz, setLoadingJuiz] = useState(true);

  // ─── Active poomsae match to score ──────────────────────────────
  const [matchAtivo, setMatchAtivo] = useState(null);
  const lastMatchIdRef = useRef(null);

  // ─── Scoring form state ──────────────────────────────────────────
  // Recognized: acuracia starts at 4.00 (countdown), apresentacao = 3 sub-notas (0-2.0 each)
  // Freestyle:  habTecnica (0-6), apresentacao = 2 sub-notas (0-2.0 each)
  const [acuraciaVal, setAcuraciaVal] = useState(4.0);
  const [habTecnicaVal, setHabTecnicaVal] = useState(0.0);
  const [subNotasApres, setSubNotasApres] = useState([0.0, 0.0, 0.0]); // max 2.0 each
  const [subNotasFreestyle, setSubNotasFreestyle] = useState([0.0, 0.0]); // Freestyle apresentacao 0-2.0 x2

  // ─── Submission state ────────────────────────────────────────────
  const [submetido, setSubmetido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [apresentacaoEncerrada, setApresentacaoEncerrada] = useState(false); // banner: "Apresentação Encerrada — Submeta sua nota"

  // ─── 1. Determine judge number from camp/quadra config ───────────
  useEffect(() => {
    if (!usuario?.email || !campId) { setLoadingJuiz(false); return; }

    fetch(`${API_BASE}/api/campeonatos/${campId}/minha-posicao-juiz/${encodeURIComponent(usuario.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setNumeroJuiz(data?.numero_juiz ?? 1);
      })
      .catch(() => setNumeroJuiz(1))
      .finally(() => setLoadingJuiz(false));
  }, [usuario?.email, campId]);

  // ─── 2. Poll for active poomsae match for this luta ─────────────
  useEffect(() => {
    if (!luta?.id) return;

    const poll = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/poomsae/matches?luta_id=${luta.id}&status=Em%20Andamento`);
        if (!resp.ok) return;
        const matches = await resp.json();

        if (matches.length > 0) {
          const match = matches[0];
          const matchId = match._id || match.id;
          if (matchId !== lastMatchIdRef.current) {
            // New match — reset form
            lastMatchIdRef.current = matchId;
            setMatchAtivo(match);
            setSubmetido(false);
            setApresentacaoEncerrada(false);
            setAcuraciaVal(4.0);
            setHabTecnicaVal(0.0);
            setSubNotasApres([0.0, 0.0, 0.0]);
            setSubNotasFreestyle([0.0, 0.0]);
            setErro(null);
            setResultado(null);
          }
        } else if (lastMatchIdRef.current && !submetido) {
          // No active match — check if the last one was calculated
          try {
            const resp2 = await fetch(`${API_BASE}/api/poomsae/matches/${lastMatchIdRef.current}`);
            if (resp2.ok) {
              const m = await resp2.json();
              if (m.resultado) {
                setResultado(m.resultado);
                setMatchAtivo(null);
                lastMatchIdRef.current = null;
              }
            }
          } catch (_) { /* ignore */ }
        }
      } catch (e) {
        console.error('[JoystickPoomsae] poll error:', e);
      }
    };

    // Always poll — even after submitting — so a new match (Hong after Chong) is detected
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [luta?.id, submetido]);

  // ─── 3. Listen for WS broadcast from mesário ────────────────────
  useEffect(() => {
    if (!ws?.current) return;
    const handleMsg = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === 'poomsae_match_iniciado') {
          lastMatchIdRef.current = data.match_id;
          setMatchAtivo({ id: data.match_id, tipo: data.tipo_poomsae, forma_designada: data.forma });
          setSubmetido(false);
          setApresentacaoEncerrada(false);
          setAcuraciaVal(4.0);
          setHabTecnicaVal(0.0);
          setSubNotasApres([0.0, 0.0, 0.0]);
          setSubNotasFreestyle([0.0, 0.0]);
          setErro(null);
          setResultado(null);
        } else if (data.tipo === 'poomsae_encerrado') {
          // Apresentação terminou — manter form ativo para o juiz poder submeter
          // Apenas mostrar banner informativo, NÃO limpar matchAtivo
          setApresentacaoEncerrada(true);
        }
      } catch (_) { /* ignore parse errors */ }
    };
    ws.current.addEventListener('message', handleMsg);
    return () => ws.current?.removeEventListener('message', handleMsg);
  }, [ws]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const isFreestyle = matchAtivo?.tipo === 'Freestyle';

  // Recognized: acuracia countdown, apresentacao = sum of 3 sub-notas
  const apresentacaoTotal = parseFloat((subNotasApres[0] + subNotasApres[1] + subNotasApres[2]).toFixed(1));
  // Freestyle: habTecnica + sum of 2 sub-notas
  const apresentacaoFreestyleTotal = parseFloat((subNotasFreestyle[0] + subNotasFreestyle[1]).toFixed(1));

  const totalGeral = isFreestyle
    ? parseFloat((habTecnicaVal + apresentacaoFreestyleTotal).toFixed(2))
    : parseFloat((acuraciaVal + apresentacaoTotal).toFixed(2));

  const isValido = () => {
    if (!matchAtivo) return false;
    if (isFreestyle) {
      return habTecnicaVal >= 0 && habTecnicaVal <= 6.0 && apresentacaoFreestyleTotal >= 0 && apresentacaoFreestyleTotal <= 4.0;
    }
    return acuraciaVal >= 0 && acuraciaVal <= 4.0 && apresentacaoTotal >= 0 && apresentacaoTotal <= 6.0;
  };

  const deductAcuracia = (amount) => {
    setAcuraciaVal(prev => parseFloat(Math.max(0, prev - amount).toFixed(1)));
  };

  const updateSubNota = (index, val) => {
    setSubNotasApres(prev => {
      const next = [...prev];
      next[index] = parseFloat(parseFloat(val).toFixed(1));
      return next;
    });
  };

  const updateSubNotaFreestyle = (index, val) => {
    setSubNotasFreestyle(prev => {
      const next = [...prev];
      next[index] = parseFloat(parseFloat(val).toFixed(1));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!isValido() || !matchAtivo || !numeroJuiz) return;
    setEnviando(true);
    setErro(null);
    try {
      const matchId = matchAtivo._id || matchAtivo.id;
      const payload = {
        match_id: matchId,
        juiz_id: usuario.email,
        numero_juiz: numeroJuiz,
        ...(isFreestyle
          ? { score_freestyle: { habilidade_tecnica: habTecnicaVal, apresentacao: apresentacaoFreestyleTotal } }
          : { score_recognized: { acuracia: acuraciaVal, apresentacao: apresentacaoTotal } }
        )
      };
      const resp = await fetch(`${API_BASE}/api/poomsae/matches/${matchId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json();
        const errMsg = Array.isArray(err.detail)
          ? err.detail.map(e => e.msg || e.message || JSON.stringify(e)).join('; ')
          : (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
        throw new Error(errMsg || 'Erro ao submeter nota');
      }
      setSubmetido(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 300]);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // ─── Renders ─────────────────────────────────────────────────────

  if (loadingJuiz) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Clock size={40} className="text-gray-500 animate-pulse" />
      </div>
    );
  }

  if (!matchAtivo && !resultado) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Clock size={60} className="text-gray-600 mb-4 animate-pulse" />
        <h2 className="text-white text-xl font-black mb-1">Aguardando Apresentação</h2>
        <p className="text-gray-400 text-sm">Juiz #{numeroJuiz ?? '...'}</p>
        <p className="text-gray-500 text-xs mt-3">O mesário iniciará a apresentação em breve.</p>
      </div>
    );
  }

  if (!matchAtivo && resultado) {
    const total = resultado.pontuacao_final;
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={60} className="text-green-400 mb-4" />
        <h2 className="text-white text-xl font-black mb-1">Nota Registrada!</h2>
        <p className="text-gray-400 text-sm mb-3">Juiz #{numeroJuiz}</p>
        {total != null && (
          <div className="bg-gray-800 border border-gray-600 rounded-xl px-8 py-4">
            <p className="text-gray-400 text-xs mb-1">Resultado Final</p>
            <p className="text-white text-5xl font-black">{total.toFixed(3)}</p>
          </div>
        )}
        <p className="text-gray-500 text-xs mt-4">Aguardando próxima apresentação...</p>
      </div>
    );
  }

  if (submetido) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-white text-2xl font-black mb-1">Nota Enviada!</h2>
        <p className="text-gray-400">Juiz #{numeroJuiz}</p>
        <p className="text-gray-400 text-sm mt-2">Aguardando todos os árbitros...</p>
        {matchAtivo?.forma_designada && (
          <div className="mt-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-xs">Forma</p>
            <p className="text-white font-bold">{matchAtivo.forma_designada}</p>
          </div>
        )}
      </div>
    );
  }

  // Scoring form — new WT UI
  const SUB_LABELS_APRES = ['Ritmo e Potência', 'Espírito e Atitude', 'Téc. de Movimento'];
  const SUB_LABELS_FREESTYLE = ['Expressão', 'Atitude'];

  // Sub-nota step control helper
  const SubNotaControl = ({ label, value, onChange, max = 2.0 }) => (
    <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="text-white text-xl font-black tabular-nums">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-3 rounded-full accent-yellow-400 cursor-pointer"
      />
      <div className="flex justify-between mt-1">
        <span className="text-gray-600 text-xs">0.0</span>
        <span className="text-gray-600 text-xs">{max.toFixed(1)}</span>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-900 p-4 overflow-auto">

      {/* Encerrada banner */}
      {apresentacaoEncerrada && !submetido && (
        <div className="bg-orange-900/60 border-2 border-orange-500 rounded-xl px-4 py-3 mb-3 text-center animate-pulse flex-shrink-0">
          <p className="text-orange-300 font-black text-sm">⏱ Apresentação Encerrada — Submeta sua nota!</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-1 mb-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-gray-300 text-xs font-bold">JUIZ #{numeroJuiz}</span>
        </div>
        <p className="text-yellow-400 text-sm font-black tracking-widest">{(matchAtivo?.tipo || 'Recognized').toUpperCase()} POOMSAE</p>
        {matchAtivo?.forma_designada && (
          <p className="text-white font-bold text-lg mt-1">{matchAtivo.forma_designada}</p>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4 max-w-xs mx-auto w-full">

        {!isFreestyle ? (
          <>
            {/* ── ACURÁCIA: countdown from 4.00 ── */}
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <p className="text-gray-300 font-bold text-sm mb-3 text-center uppercase tracking-wider">
                Acurácia <span className="text-gray-500 font-normal">(máx 4.0)</span>
              </p>
              <div className="text-center mb-4">
                <span className={`text-7xl font-black tabular-nums ${acuraciaVal < 2.0 ? 'text-red-400' : acuraciaVal < 3.0 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {acuraciaVal.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => deductAcuracia(0.1)}
                  disabled={acuraciaVal <= 0}
                  className="py-3 rounded-xl font-black text-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95"
                >
                  −0.1
                </button>
                <button
                  onClick={() => deductAcuracia(0.3)}
                  disabled={acuraciaVal <= 0}
                  className="py-3 rounded-xl font-black text-lg bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95"
                >
                  −0.3
                </button>
                <button
                  onClick={() => setAcuraciaVal(4.0)}
                  className="py-3 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* ── APRESENTAÇÃO: 3 sub-notas 0-2.0 ── */}
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 font-bold text-sm uppercase tracking-wider">
                  Apresentação <span className="text-gray-500 font-normal">(máx 6.0)</span>
                </p>
                <span className="text-yellow-400 font-black text-lg tabular-nums">{apresentacaoTotal.toFixed(1)}</span>
              </div>
              <div className="space-y-3">
                {SUB_LABELS_APRES.map((label, i) => (
                  <SubNotaControl
                    key={i}
                    label={label}
                    value={subNotasApres[i]}
                    onChange={(val) => updateSubNota(i, val)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── FREESTYLE: Habilidade Técnica (0-6) ── */}
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <p className="text-gray-300 font-bold text-sm mb-3 text-center uppercase tracking-wider">
                Hab. Técnica <span className="text-gray-500 font-normal">(máx 6.0)</span>
              </p>
              <div className="text-center mb-3">
                <span className="text-6xl font-black text-yellow-400 tabular-nums">{habTecnicaVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.1"
                value={habTecnicaVal}
                onChange={(e) => setHabTecnicaVal(parseFloat(e.target.value))}
                className="w-full h-3 rounded-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-gray-600 text-xs">0.0</span>
                <span className="text-gray-600 text-xs">6.0</span>
              </div>
            </div>

            {/* ── FREESTYLE: Apresentação (2 sub-notas 0-2.0) ── */}
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 font-bold text-sm uppercase tracking-wider">
                  Apresentação <span className="text-gray-500 font-normal">(máx 4.0)</span>
                </p>
                <span className="text-yellow-400 font-black text-lg tabular-nums">{apresentacaoFreestyleTotal.toFixed(1)}</span>
              </div>
              <div className="space-y-3">
                {SUB_LABELS_FREESTYLE.map((label, i) => (
                  <SubNotaControl
                    key={i}
                    label={label}
                    value={subNotasFreestyle[i]}
                    onChange={(val) => updateSubNotaFreestyle(i, val)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Total */}
        <div className="bg-black rounded-xl p-3 text-center border border-gray-700">
          <p className="text-gray-400 text-xs mb-0.5">TOTAL</p>
          <p className="text-white text-5xl font-black tabular-nums">{totalGeral.toFixed(2)}</p>
          <p className="text-gray-500 text-xs">/ 10.0</p>
        </div>

        {/* Error */}
        {erro && (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-3 text-center">
            <AlertTriangle size={16} className="inline mr-1 text-red-400" />
            <span className="text-red-300 text-sm">{erro}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValido() || enviando}
          className="w-full py-5 rounded-xl font-black text-xl tracking-widest uppercase transition-all bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg mb-4 active:scale-95"
        >
          {enviando ? 'Enviando...' : 'Confirmar Nota'}
        </button>
      </div>
    </div>
  );
}
