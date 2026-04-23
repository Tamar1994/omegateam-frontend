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
  const [acuracia, setAcuracia] = useState('');
  const [habTecnica, setHabTecnica] = useState('');
  const [apresentacao, setApresentacao] = useState('');

  // ─── Submission state ────────────────────────────────────────────
  const [submetido, setSubmetido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);

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
          if (match.id !== lastMatchIdRef.current) {
            // New match — reset form
            lastMatchIdRef.current = match.id;
            setMatchAtivo(match);
            setSubmetido(false);
            setAcuracia('');
            setHabTecnica('');
            setApresentacao('');
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

    // Só inicia poll se o juiz ainda não submeteu (evita requests desnecessários)
    if (submetido) return;
    poll();
    const interval = setInterval(poll, 15000); // 15s: WS já cobre tempo real
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
          setAcuracia('');
          setHabTecnica('');
          setApresentacao('');
          setErro(null);
          setResultado(null);
        } else if (data.tipo === 'poomsae_encerrado') {
          // Apresentação terminou — limpar match ativo se não submeteu ainda
          if (!submetido) {
            setMatchAtivo(null);
          }
        }
      } catch (_) { /* ignore parse errors */ }
    };
    ws.current.addEventListener('message', handleMsg);
    return () => ws.current?.removeEventListener('message', handleMsg);
  }, [ws]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const isFreestyle = matchAtivo?.tipo === 'Freestyle';

  const comp1Val = isFreestyle ? parseFloat(habTecnica) : parseFloat(acuracia);
  const comp2Val = parseFloat(apresentacao);
  const comp1Max = isFreestyle ? 6.0 : 4.0;
  const comp2Max = isFreestyle ? 4.0 : 6.0;

  const isValido = () => {
    if (!matchAtivo) return false;
    return (
      !isNaN(comp1Val) && comp1Val >= 0 && comp1Val <= comp1Max &&
      !isNaN(comp2Val) && comp2Val >= 0 && comp2Val <= comp2Max
    );
  };

  const quickButtons1 = isFreestyle
    ? [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]
    : [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

  const quickButtons2 = isFreestyle
    ? [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    : [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];

  const handleSubmit = async () => {
    if (!isValido() || !matchAtivo || !numeroJuiz) return;
    setEnviando(true);
    setErro(null);
    try {
      const payload = {
        match_id: matchAtivo.id,
        juiz_id: usuario.email,
        numero_juiz: numeroJuiz,
        ...(isFreestyle
          ? { score_freestyle: { habilidade_tecnica: comp1Val, apresentacao: comp2Val } }
          : { score_recognized: { acuracia: comp1Val, apresentacao: comp2Val } }
        )
      };
      const resp = await fetch(`${API_BASE}/api/poomsae/matches/${matchAtivo.id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Erro ao submeter nota');
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

  // Scoring form
  const tipo = matchAtivo?.tipo || 'Recognized';
  const totalPreview = isValido() ? (comp1Val + comp2Val) : null;

  return (
    <div className="h-full flex flex-col bg-gray-900 p-4 overflow-auto">

      {/* Header */}
      <div className="text-center mb-5 flex-shrink-0">
        <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-1 mb-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-gray-300 text-xs font-bold">JUIZ #{numeroJuiz}</span>
        </div>
        <p className="text-yellow-400 text-sm font-black tracking-widest">{tipo.toUpperCase()} POOMSAE</p>
        {matchAtivo?.forma_designada && (
          <p className="text-white font-bold text-lg mt-1">{matchAtivo.forma_designada}</p>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col gap-4 max-w-xs mx-auto w-full">

        {/* Component 1 */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="block text-gray-300 font-bold text-sm mb-1">
            {isFreestyle ? 'Habilidade Técnica' : 'Acurácia'}
            <span className="text-gray-500 ml-2 font-normal">0.0 – {comp1Max.toFixed(1)}</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max={comp1Max}
            value={isFreestyle ? habTecnica : acuracia}
            onChange={(e) => isFreestyle ? setHabTecnica(e.target.value) : setAcuracia(e.target.value)}
            className="w-full bg-gray-900 text-white text-4xl font-black text-center rounded-lg p-3 border-2 border-gray-600 focus:border-yellow-500 outline-none"
            placeholder="0.0"
          />
          <div className="grid grid-cols-7 gap-1 mt-2">
            {quickButtons1.map(v => (
              <button
                key={v}
                onClick={() => isFreestyle ? setHabTecnica(String(v)) : setAcuracia(String(v))}
                className={`py-1 rounded text-xs font-bold transition-colors ${(isFreestyle ? parseFloat(habTecnica) : parseFloat(acuracia)) === v ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Component 2: Apresentação */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="block text-gray-300 font-bold text-sm mb-1">
            Apresentação
            <span className="text-gray-500 ml-2 font-normal">0.0 – {comp2Max.toFixed(1)}</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max={comp2Max}
            value={apresentacao}
            onChange={(e) => setApresentacao(e.target.value)}
            className="w-full bg-gray-900 text-white text-4xl font-black text-center rounded-lg p-3 border-2 border-gray-600 focus:border-yellow-500 outline-none"
            placeholder="0.0"
          />
          <div className="grid grid-cols-7 gap-1 mt-2">
            {quickButtons2.map(v => (
              <button
                key={v}
                onClick={() => setApresentacao(String(v))}
                className={`py-1 rounded text-xs font-bold transition-colors ${parseFloat(apresentacao) === v ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Total preview */}
        {totalPreview !== null && (
          <div className="bg-black rounded-xl p-3 text-center border border-gray-700">
            <p className="text-gray-400 text-xs mb-0.5">TOTAL</p>
            <p className="text-white text-5xl font-black">{totalPreview.toFixed(1)}</p>
            <p className="text-gray-500 text-xs">/ 10.0</p>
          </div>
        )}

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
          className="w-full py-5 rounded-xl font-black text-xl tracking-widest uppercase transition-all bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg mb-4"
        >
          {enviando ? 'Enviando...' : 'Confirmar Nota'}
        </button>
      </div>
    </div>
  );
}
