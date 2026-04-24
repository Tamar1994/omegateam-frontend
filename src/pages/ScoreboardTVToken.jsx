import React, { useState, useEffect } from 'react';
import { Lock, Zap } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Scoreboard TV Profissional - Página FIXA para exibição em TV
 * 
 * Funcionalidades:
 * 1. Input do token (XXXX-XXXX) com validação
 * 2. Polling automático a cada 2 segundos
 * 3. Layout profissional tipo Taekwondo TV
 * 4. Placar gigante, timer, round, faltas
 * 5. Suporte Kyorugui e Poomsae
 */
export function ScoreboardTVToken() {
  const [token, setToken] = useState('');
  const [tokenValidado, setTokenValidado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [lutaAtual, setLutaAtual] = useState(null);
  
  // ==========================================
  // VALIDAÇÃO DO TOKEN
  // ==========================================
  const handleTokenChange = (e) => {
    let valor = e.target.value.toUpperCase();
    
    // Formatar automaticamente para XXXX-XXXX
    valor = valor.replace(/[^A-Z0-9-]/g, '');
    if (valor.length > 4 && !valor.includes('-')) {
      valor = valor.slice(0, 4) + '-' + valor.slice(4, 8);
    }
    valor = valor.slice(0, 9); // Máximo XXXX-XXXX
    
    setToken(valor);
  };

  const validarToken = async (e) => {
    e.preventDefault();
    
    if (!token || token.length !== 9) {
      setErro('Token deve estar no formato XXXX-XXXX');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scoreboard/access/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        setErro(data.detail || 'Token inválido');
        setCarregando(false);
        return;
      }

      // ✅ Token válido - armazenar e começar polling
      sessionStorage.setItem('scoreboard_token', token);
      sessionStorage.setItem('scoreboard_acesso', 'true');
      setTokenValidado(true);
      setCarregando(false);
    } catch (err) {
      console.error('Erro ao validar token:', err);
      setErro('Erro ao conectar com o servidor');
      setCarregando(false);
    }
  };

  // ==========================================
  // POLLING: BUSCAR LUTA ATUAL USANDO TOKEN
  // ==========================================
  useEffect(() => {
    if (!tokenValidado) return;

    const buscarDados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scoreboard/luta-atual?token=${token}`);
        if (res.ok) {
          const dados = await res.json();
          setLutaAtual(dados.luta);
        } else {
          setErro('Token expirado ou inválido');
          setTokenValidado(false);
          sessionStorage.removeItem('scoreboard_token');
          sessionStorage.removeItem('scoreboard_acesso');
        }
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
        // Não mostrar erro durante polling, apenas continua tentando
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 2000); // 2s: atualiza turno_poomsae rapidamente
    return () => clearInterval(intervalo);
  }, [tokenValidado, token]);

  // ==========================================
  // TELA 1: INPUT DO TOKEN
  // ==========================================
  if (!tokenValidado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-omega-dark via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-omega-red rounded-full p-4 shadow-lg shadow-omega-red/50">
                <Zap size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">SCOREBOARD TV</h1>
            <p className="text-gray-400 text-sm">Insira o código de acesso fornecido pelo Mesário</p>
          </div>

          {/* Formulário */}
          <form onSubmit={validarToken} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-bold mb-3 text-sm tracking-widest uppercase">
                <Lock size={16} className="inline mr-2" />
                Código de Acesso
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX"
                value={token}
                onChange={handleTokenChange}
                maxLength="9"
                className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white font-black text-center text-3xl tracking-widest focus:border-omega-red focus:outline-none transition-colors"
              />
            </div>

            {erro && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
                <p className="text-red-300 font-bold text-sm">⚠️ {erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || token.length !== 9}
              className="w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-omega-red hover:bg-red-700 text-white"
            >
              {carregando ? 'VALIDANDO...' : 'ACESSAR SCOREBOARD'}
            </button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Sistema de Scoreboard profissional para competições de Taekwondo
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: EXIBIÇÃO DO SCOREBOARD
  // ==========================================

  // Logo Omega quando não há luta
  if (!lutaAtual) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <img src={omegaLogo} alt="Omega Team" className="h-40" />
          <p className="text-white text-4xl font-black tracking-widest">AGUARDANDO PRÓXIMA LUTA</p>
        </div>
      </div>
    );
  }

  // Renderizar Kyorugui ou Poomsae
  if (lutaAtual.modalidade === 'Kyorugui') {
    return <ScoreboardKyorugui luta={lutaAtual} />;
  } else if (lutaAtual.modalidade === 'Poomsae') {
    return <ScoreboardPoomsae luta={lutaAtual} />;
  }

  return null;
}

// ==========================================
// COMPONENTE: KYORUGUI PROFISSIONAL PARA TV
// ==========================================
function ScoreboardKyorugui({ luta }) {
  const extrairPais = (nome) => {
    const match = nome?.match(/\(([^)]+)\)$/);
    return match ? match[1] : '';
  };

  const pais_vermelho = extrairPais(luta.atleta_vermelho);
  const pais_azul = extrairPais(luta.atleta_azul);
  const nome_vermelho = luta.atleta_vermelho?.split(' (')[0] || 'ATLETA';
  const nome_azul = luta.atleta_azul?.split(' (')[0] || 'ATLETA';

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      
      {/* ===== LADO ESQUERDO - VERMELHO ===== */}
      <div className="flex-1 bg-red-950 border-r-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País/Bandeira */}
        <div className="text-center mb-4">
          <p className="text-red-300 text-4xl font-black tracking-widest">{pais_vermelho || 'MAR'}</p>
        </div>

        {/* Nome do Atleta */}
        <h1 className="text-center text-7xl font-black text-white leading-none mb-8 line-clamp-3">
          {nome_vermelho}
        </h1>

        {/* Placar Gigante */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <p className="text-9xl font-black text-red-400" style={{textShadow: '0 0 20px rgba(220, 38, 38, 0.8)'}}>
            {luta.placar_red || 0}
          </p>
        </div>

        {/* Faltas */}
        <div className="text-center bg-red-900/50 rounded-2xl p-6 border-4 border-red-600">
          <p className="text-red-300 text-2xl font-bold mb-2">FALTAS (GAM-JEOM)</p>
          <p className="text-7xl font-black text-red-400">{luta.faltas_red || 0}</p>
        </div>
      </div>

      {/* ===== CENTRO - ROUND E TIMER ===== */}
      <div className="w-96 bg-black border-x-8 border-yellow-400 flex flex-col items-center justify-center gap-8 p-8">
        
        {/* Round */}
        <div className="text-center">
          <p className="text-yellow-400 text-4xl font-black mb-4">ROUND</p>
          <p className="text-9xl font-black text-white">{luta.round || 1}</p>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-gray-400 text-2xl font-bold uppercase tracking-widest">
            {luta.status || 'Aguardando'}
          </p>
        </div>

        {/* Categoria */}
        <div className="text-center mt-auto text-gray-500">
          <p className="text-sm font-bold">{luta.nome_categoria || ''}</p>
        </div>
      </div>

      {/* ===== LADO DIREITO - AZUL ===== */}
      <div className="flex-1 bg-blue-950 border-l-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País/Bandeira */}
        <div className="text-center mb-4">
          <p className="text-blue-300 text-4xl font-black tracking-widest">{pais_azul || 'KOR'}</p>
        </div>

        {/* Nome do Atleta */}
        <h1 className="text-center text-7xl font-black text-white leading-none mb-8 line-clamp-3">
          {nome_azul}
        </h1>

        {/* Placar Gigante */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <p className="text-9xl font-black text-blue-400" style={{textShadow: '0 0 20px rgba(37, 99, 235, 0.8)'}}>
            {luta.placar_blue || 0}
          </p>
        </div>

        {/* Faltas */}
        <div className="text-center bg-blue-900/50 rounded-2xl p-6 border-4 border-blue-600">
          <p className="text-blue-300 text-2xl font-bold mb-2">FALTAS (GAM-JEOM)</p>
          <p className="text-7xl font-black text-blue-400">{luta.faltas_blue || 0}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: POOMSAE PROFISSIONAL PARA TV
// ==========================================
function ScoreboardPoomsae({ luta }) {
  const [matches, setMatches] = React.useState([]);
  const [scoresColetando, setScoresColetando] = React.useState(null); // scores do match em coleta
  const [scoresChong, setScoresChong] = React.useState(null); // scores finalizados do Chong
  const [timerSegundos, setTimerSegundos] = React.useState(null);
  const timerIntervalRef = React.useRef(null);
  const activeMatchIdRef = React.useRef(null);

  const lutaId = luta._id || luta.id;
  const nome_vermelho = luta.atleta_vermelho?.split(' (')[0] || 'ATLETA';
  const nome_azul = luta.atleta_azul?.split(' (')[0] || 'ATLETA';
  const equipe_vermelho = luta.atleta_vermelho?.match(/\(([^)]+)\)$/)?.[1] || '';
  const equipe_azul = luta.atleta_azul?.match(/\(([^)]+)\)$/)?.[1] || '';

  // Poll poomsae matches every 1.5s
  React.useEffect(() => {
    if (!lutaId) return;
    const buscar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/poomsae/matches?luta_id=${lutaId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMatches(data.sort((a, b) => new Date(a.timestamp_criacao || a.criado_em || 0) - new Date(b.timestamp_criacao || b.criado_em || 0)));
      } catch {}
    };
    buscar();
    const iv = setInterval(buscar, 1500);
    return () => clearInterval(iv);
  }, [lutaId]);

  const STATUSES_FIM = ['Aguardando Scores', 'Calculado', 'Concluído'];
  const STATUSES_COLETANDO = ['Aguardando Scores'];

  const turno = luta.turno_poomsae || 'chong_p1';
  const isChong = !turno.startsWith('hong');

  const matchAtivo = matches.find(m => m.status === 'Em Andamento') || null;
  // Match que acabou de encerrar e está coletando notas (não tem resultado ainda)
  const matchColetando = matches.find(m => STATUSES_COLETANDO.includes(m.status) && !m.resultado) || null;

  const matchesFinalizados = matches
    .filter(m => STATUSES_FIM.includes(m.status))
    .sort((a, b) => new Date(a.timestamp_criacao || 0) - new Date(b.timestamp_criacao || 0));
  const matchFinalVermelho = matchesFinalizados[0] || null;
  const matchFinalAzul = matchesFinalizados[1] || null;

  // Poll scores quando há match coletando
  React.useEffect(() => {
    if (!matchColetando) { setScoresColetando(null); return; }
    const matchId = matchColetando._id;
    const buscar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}/scores`);
        if (!res.ok) return;
        const data = await res.json();
        setScoresColetando(data);
      } catch {}
    };
    buscar();
    const iv = setInterval(buscar, 2000);
    return () => clearInterval(iv);
  }, [matchColetando?._id]);

  // Timer
  React.useEffect(() => {
    if (!matchAtivo) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setTimerSegundos(null);
      activeMatchIdRef.current = null;
      return;
    }
    if (matchAtivo._id === activeMatchIdRef.current) return;
    activeMatchIdRef.current = matchAtivo._id;
    const limite = matchAtivo.tipo_poomsae === 'Freestyle' ? 100 : 90;
    let remaining = limite;
    if (matchAtivo.timestamp_inicio) {
      const elapsed = Math.floor((Date.now() - new Date(matchAtivo.timestamp_inicio).getTime()) / 1000);
      remaining = Math.max(0, limite - elapsed);
    }
    setTimerSegundos(remaining);
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerSegundos(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
    }, 1000);
  }, [matchAtivo?._id]);

  React.useEffect(() => () => clearInterval(timerIntervalRef.current), []);

  // Poll scores do match finalizado do Chong — para exibir breakdown por juiz
  React.useEffect(() => {
    if (!matchFinalVermelho) { setScoresChong(null); return; }
    const matchId = matchFinalVermelho._id;
    const buscar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}/scores`);
        if (!res.ok) return;
        const data = await res.json();
        setScoresChong(data);
      } catch {}
    };
    buscar();
    const iv = setInterval(buscar, 3000);
    return () => clearInterval(iv);
  }, [matchFinalVermelho?._id]);

  const formatarTempo = (s) => {
    if (s === null) return '--:--';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const timerStr = formatarTempo(timerSegundos);
  const timerCritico = timerSegundos !== null && timerSegundos <= 15;

  // Fase atual:
  // Prioridade 1: matchAtivo (match "Em Andamento" encontrado via poll)
  // Prioridade 2: turno_poomsae (campo salvo no doc da luta ao iniciar apresentação)
  //   → luta.turno_poomsae fica indefinido antes de qualquer apresentação
  //   → é salvo como 'chong_p1' ou 'hong_p1' em ≤2s após "Iniciar Apresentação"
  //   → garante transição imediata mesmo se o poll de matches ainda não retornou
  const turnoSet = !!luta.turno_poomsae;
  let fase;
  if (matchAtivo) {
    fase = isChong ? 'vermelho_apresentando' : 'azul_apresentando';
  } else if (matchColetando) {
    fase = 'coletando';
  } else if (matchesFinalizados.length >= 2) {
    fase = 'resultado';
  } else if (matchesFinalizados.length >= 1) {
    fase = !isChong ? 'azul_apresentando' : 'aguardando_azul';
  } else if (turnoSet) {
    fase = isChong ? 'vermelho_apresentando' : 'azul_apresentando';
  } else {
    fase = 'espera';
  }

  // ── Helpers de campo por tipo de score ─────────────────────────────
  const getAc = (s) => s?.score_recognized?.acuracia ?? null;
  const getAp = (s) => s?.score_recognized?.apresentacao ?? s?.score_freestyle?.apresentacao ?? null;
  const getTec = (s) => s?.score_freestyle?.habilidade_tecnica ?? null;
  const calcDesc = (arr, getter) => {
    const vals = arr.map(getter).filter(v => v != null);
    if (vals.length < 4) return { max: null, min: null };
    return { max: Math.max(...vals), min: Math.min(...vals) };
  };

  // ── TELA COLETANDO: árbitros enviando notas ──────────────────────
  if (fase === 'coletando') {
    const match = matchColetando;
    const numJuizes = match.numero_juizes || 1;
    const scoresRecebidos = scoresColetando?.scores || [];
    const todosSubmeteram = scoresRecebidos.length >= numJuizes;
    const atletaCor = isChong ? 'vermelho' : 'azul';
    const atletaNome = atletaCor === 'vermelho' ? nome_vermelho : nome_azul;
    const corBg = atletaCor === 'vermelho' ? 'from-red-950 to-gray-950' : 'from-blue-950 to-gray-950';
    const corText = atletaCor === 'vermelho' ? 'text-red-400' : 'text-blue-400';
    const corBorder = atletaCor === 'vermelho' ? 'border-red-700' : 'border-blue-700';
    const isFreestyle = match.tipo_poomsae === 'Freestyle';

    // Descartes por componente (só quando todos submeteram, com 4+ juízes)
    const descAcuracia = todosSubmeteram ? calcDesc(scoresRecebidos, getAc) : { max: null, min: null };
    const descApresentacao = todosSubmeteram ? calcDesc(scoresRecebidos, getAp) : { max: null, min: null };
    const descTecnica = todosSubmeteram ? calcDesc(scoresRecebidos, getTec) : { max: null, min: null };

    const isDescartadoAcuracia = (val) => val != null && descAcuracia.max != null && (val === descAcuracia.max || val === descAcuracia.min);
    const isDescartadoApresentacao = (val) => val != null && descApresentacao.max != null && (val === descApresentacao.max || val === descApresentacao.min);
    const isDescartadoTecnica = (val) => val != null && descTecnica.max != null && (val === descTecnica.max || val === descTecnica.min);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${corBg} text-white flex flex-col select-none`}>
        {/* Header */}
        <div className="bg-black/60 py-4 px-8 flex justify-between items-center border-b-2 border-gray-700">
          <div className={`px-5 py-2 rounded-full border-2 ${corBorder} bg-black/40`}>
            <p className={`${corText} text-xl font-black tracking-widest`}>
              {atletaCor === 'vermelho' ? '🔴 CHONG' : '🔵 HONG'} — COLETANDO NOTAS
            </p>
          </div>
          <p className="text-gray-300 font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-10 opacity-50" />
        </div>

        {/* Atleta */}
        <div className="text-center py-6">
          <h2 className="text-5xl font-black text-white">{atletaNome}</h2>
          <p className={`${corText} text-lg font-bold mt-1`}>{match.forma_designada || luta.poomsae_1}</p>
        </div>

        {/* Tabela de notas */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-4xl">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-gray-400 font-black text-sm tracking-widest text-center">ÁRBITRO</div>
              <div className="text-gray-400 font-black text-sm tracking-widest text-center">ACCURACY</div>
              <div className="text-gray-400 font-black text-sm tracking-widest text-center">PRESENTATION</div>
              <div className="text-gray-400 font-black text-sm tracking-widest text-center">TÉCNICA</div>
            </div>

            {/* Linhas de árbitros */}
            {Array.from({ length: numJuizes }, (_, i) => {
              const juizNum = i + 1;
              const score = scoresRecebidos.find(s => s.numero_juiz === juizNum);
              const submeteu = !!score;
              const mostrarValores = todosSubmeteram && submeteu;

              const acVal = getAc(score);
              const apVal = getAp(score);
              const tecVal = getTec(score);

              return (
                <div key={juizNum} className={`grid grid-cols-4 gap-3 mb-3 rounded-xl p-4 border ${submeteu ? 'bg-black/40 border-gray-600' : 'bg-black/20 border-gray-800'}`}>
                  {/* Label */}
                  <div className="flex items-center justify-center">
                    <span className={`text-2xl font-black ${submeteu ? (todosSubmeteram ? 'text-white' : `${corText}`) : 'text-gray-600'}`}>
                      L{juizNum}
                      {submeteu && !todosSubmeteram && <span className="ml-2 text-green-400 text-sm">✓</span>}
                    </span>
                  </div>

                  {/* Accuracy */}
                  <div className="flex items-center justify-center">
                    {!submeteu ? (
                      <span className="text-gray-600 text-3xl font-black animate-pulse">—</span>
                    ) : !todosSubmeteram ? (
                      <span className={`text-3xl font-black ${corText}`}>4.0</span>
                    ) : (
                      <span className={`text-3xl font-black ${isDescartadoAcuracia(acVal) ? 'text-gray-500 line-through opacity-40' : 'text-white'}`}>
                        {acVal?.toFixed(1) ?? '—'}
                      </span>
                    )}
                  </div>

                  {/* Presentation */}
                  <div className="flex items-center justify-center">
                    {!submeteu ? (
                      <span className="text-gray-600 text-3xl font-black animate-pulse">—</span>
                    ) : !todosSubmeteram ? (
                      <span className={`text-3xl font-black ${corText}`}>6.0</span>
                    ) : (
                      <span className={`text-3xl font-black ${isDescartadoApresentacao(apVal) ? 'text-gray-500 line-through opacity-40' : 'text-white'}`}>
                        {apVal?.toFixed(1) ?? '—'}
                      </span>
                    )}
                  </div>

                  {/* Técnica (Freestyle) */}
                  <div className="flex items-center justify-center">
                    {match.tipo_poomsae === 'Freestyle' ? (
                      !submeteu ? (
                        <span className="text-gray-600 text-3xl font-black animate-pulse">—</span>
                      ) : !todosSubmeteram ? (
                        <span className={`text-3xl font-black ${corText}`}>—</span>
                      ) : (
                        <span className={`text-3xl font-black ${isDescartadoTecnica(tecVal) ? 'text-gray-500 line-through opacity-40' : 'text-white'}`}>
                          {tecVal?.toFixed(1) ?? '—'}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-700 text-xl">N/A</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Status */}
            <div className="text-center mt-6">
              {!todosSubmeteram ? (
                <p className="text-yellow-400 text-xl font-black animate-pulse">
                  ⏳ Aguardando {numJuizes - scoresRecebidos.length} árbitro(s)...
                </p>
              ) : (
                <p className="text-green-400 text-xl font-black">✓ Todas as notas recebidas — Calculando...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA SCORES CHONG: breakdown por juiz após Chong finalizar ──────
  if (fase === 'chong_scores') {
    const resultado = matchFinalVermelho?.resultado;
    const numJuizes = matchFinalVermelho?.numero_juizes || 1;
    const scoresArr = scoresChong?.scores || [];
    const isFreestyle = matchFinalVermelho?.tipo_poomsae === 'Freestyle';

    // Usar detalhe do resultado para identificar descartes (já calculado pelo backend)
    const detAc = resultado?.detalhe_acuracia;
    const detAp = resultado?.detalhe_apresentacao;
    const detTec = resultado?.detalhe_habilidade_tecnica;

    const isAcDesc = (val) => val != null && detAc && detAc.num_juizes >= 4 && (val === detAc.score_max || val === detAc.score_min);
    const isApDesc = (val) => val != null && detAp && detAp.num_juizes >= 4 && (val === detAp.score_max || val === detAp.score_min);
    const isTecDesc = (val) => val != null && detTec && detTec.num_juizes >= 4 && (val === detTec.score_max || val === detTec.score_min);

    const ScoreCell = ({ val, isDesc }) => (
      <div className="flex items-center justify-center">
        <span className={`text-3xl font-black tabular-nums ${
          isDesc ? 'text-gray-500 line-through opacity-40' : 'text-white'
        }`}>{val != null ? val.toFixed(1) : '—'}</span>
      </div>
    );

    return (
      <div className="min-h-screen bg-black text-white flex flex-col select-none">
        {/* Header */}
        <div className="bg-gray-900 py-4 px-8 flex justify-between items-center border-b-2 border-red-800">
          <p className="text-red-400 text-xl font-black tracking-widest">🔴 CHONG — NOTAS FINAIS</p>
          <p className="text-gray-300 font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-10 opacity-50" />
        </div>

        <div className="flex-1 flex">
          {/* Esquerda: Chong scores breakdown */}
          <div className="flex-1 flex flex-col p-10 gap-6 border-r border-gray-800">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white">{nome_vermelho}</h2>
              {equipe_vermelho && <p className="text-red-300 text-lg font-bold mt-1">{equipe_vermelho}</p>}
              <p className="text-red-400 text-sm font-bold mt-1">{matchFinalVermelho?.forma_designada || luta.poomsae_1}</p>
            </div>

            {resultado && (
              <div className="text-center bg-red-950/40 rounded-2xl py-4 border border-red-800">
                <p className="text-gray-400 text-xs font-black tracking-widest mb-1">PONTUAÇÃO FINAL</p>
                <p className="text-red-400 text-6xl font-black tabular-nums">{resultado.pontuacao_final?.toFixed(3)}</p>
              </div>
            )}

            {/* Tabela por juiz */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">ÁRBITRO</div>
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">{isFreestyle ? 'TÉCNICA' : 'ACCURACY'}</div>
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">PRESENTATION</div>
              </div>
              {Array.from({ length: numJuizes }, (_, i) => {
                const juizNum = i + 1;
                const score = scoresArr.find(s => s.numero_juiz === juizNum);
                const acVal = getAc(score);
                const apVal = getAp(score);
                const tecVal = getTec(score);
                return (
                  <div key={juizNum} className="grid grid-cols-3 gap-3 mb-3 rounded-xl p-3 border bg-gray-900/50 border-gray-700">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-black text-white">L{juizNum}</span>
                    </div>
                    {isFreestyle
                      ? <ScoreCell val={tecVal} isDesc={isTecDesc(tecVal)} />
                      : <ScoreCell val={acVal} isDesc={isAcDesc(acVal)} />
                    }
                    <ScoreCell val={apVal} isDesc={isApDesc(apVal)} />
                  </div>
                );
              })}
              {/* Médias finais */}
              {resultado && (
                <div className="grid grid-cols-3 gap-3 mt-2 rounded-xl p-3 border border-yellow-700 bg-yellow-950/30">
                  <div className="text-yellow-400 text-sm font-black text-center flex items-center justify-center">MÉDIA</div>
                  <div className="text-center">
                    <span className="text-yellow-300 text-2xl font-black">
                      {isFreestyle ? (detTec?.media?.toFixed(2) ?? '—') : (detAc?.media?.toFixed(2) ?? '—')}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-yellow-300 text-2xl font-black">{detAp?.media?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Direita: Hong próximo */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 bg-blue-950/10">
            <p className="text-blue-400 text-2xl font-black">🔵 HONG</p>
            <h2 className="text-5xl font-black text-white text-center leading-tight">{nome_azul}</h2>
            {equipe_azul && <p className="text-blue-300 text-xl font-bold">{equipe_azul}</p>}
            <p className="text-yellow-400 text-2xl font-black animate-pulse mt-6">▶ PRÓXIMO A APRESENTAR</p>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA SCORES CHONG: breakdown por juiz após Chong finalizar ──────
  if (fase === 'chong_scores') {
    const resultado = matchFinalVermelho?.resultado;
    const numJuizes = matchFinalVermelho?.numero_juizes || 1;
    const scoresArr = scoresChong?.scores || [];
    const isFreestyle = matchFinalVermelho?.tipo_poomsae === 'Freestyle';

    const detAc = resultado?.detalhe_acuracia;
    const detAp = resultado?.detalhe_apresentacao;
    const detTec = resultado?.detalhe_habilidade_tecnica;

    const isAcDesc = (val) => val != null && detAc && detAc.num_juizes >= 4 && (val === detAc.score_max || val === detAc.score_min);
    const isApDesc = (val) => val != null && detAp && detAp.num_juizes >= 4 && (val === detAp.score_max || val === detAp.score_min);
    const isTecDesc = (val) => val != null && detTec && detTec.num_juizes >= 4 && (val === detTec.score_max || val === detTec.score_min);

    const ScoreCell = ({ val, isDesc }) => (
      <div className="flex items-center justify-center">
        <span className={`text-3xl font-black tabular-nums ${isDesc ? 'text-gray-500 line-through opacity-40' : 'text-white'}`}>
          {val != null ? val.toFixed(1) : '—'}
        </span>
      </div>
    );

    return (
      <div className="min-h-screen bg-black text-white flex flex-col select-none">
        <div className="bg-gray-900 py-4 px-8 flex justify-between items-center border-b-2 border-red-800">
          <p className="text-red-400 text-xl font-black tracking-widest">🔴 CHONG — NOTAS FINAIS</p>
          <p className="text-gray-300 font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-10 opacity-50" />
        </div>

        <div className="flex-1 flex">
          {/* Esquerda: Chong scores breakdown */}
          <div className="flex-1 flex flex-col p-10 gap-6 border-r border-gray-800">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white">{nome_vermelho}</h2>
              {equipe_vermelho && <p className="text-red-300 text-lg font-bold mt-1">{equipe_vermelho}</p>}
              <p className="text-red-400 text-sm font-bold mt-1">{matchFinalVermelho?.forma_designada || luta.poomsae_1}</p>
            </div>

            {resultado && (
              <div className="text-center bg-red-950/40 rounded-2xl py-4 border border-red-800">
                <p className="text-gray-400 text-xs font-black tracking-widest mb-1">PONTUAÇÃO FINAL</p>
                <p className="text-red-400 text-6xl font-black tabular-nums">{resultado.pontuacao_final?.toFixed(3)}</p>
              </div>
            )}

            <div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">ÁRBITRO</div>
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">{isFreestyle ? 'TÉCNICA' : 'ACCURACY'}</div>
                <div className="text-gray-500 text-xs font-black tracking-widest text-center">PRESENTATION</div>
              </div>
              {Array.from({ length: numJuizes }, (_, i) => {
                const juizNum = i + 1;
                const score = scoresArr.find(s => s.numero_juiz === juizNum);
                const acVal = getAc(score);
                const apVal = getAp(score);
                const tecVal = getTec(score);
                return (
                  <div key={juizNum} className="grid grid-cols-3 gap-3 mb-3 rounded-xl p-3 border bg-gray-900/50 border-gray-700">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-black text-white">L{juizNum}</span>
                    </div>
                    {isFreestyle
                      ? <ScoreCell val={tecVal} isDesc={isTecDesc(tecVal)} />
                      : <ScoreCell val={acVal} isDesc={isAcDesc(acVal)} />
                    }
                    <ScoreCell val={apVal} isDesc={isApDesc(apVal)} />
                  </div>
                );
              })}
              {resultado && (
                <div className="grid grid-cols-3 gap-3 mt-2 rounded-xl p-3 border border-yellow-700 bg-yellow-950/30">
                  <div className="text-yellow-400 text-sm font-black text-center flex items-center justify-center">MÉDIA</div>
                  <div className="text-center">
                    <span className="text-yellow-300 text-2xl font-black">
                      {isFreestyle ? (detTec?.media?.toFixed(2) ?? '—') : (detAc?.media?.toFixed(2) ?? '—')}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-yellow-300 text-2xl font-black">{detAp?.media?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Direita: Hong próximo */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 bg-blue-950/10">
            <p className="text-blue-400 text-2xl font-black">🔵 HONG</p>
            <h2 className="text-5xl font-black text-white text-center leading-tight">{nome_azul}</h2>
            {equipe_azul && <p className="text-blue-300 text-xl font-bold">{equipe_azul}</p>}
            <p className="text-yellow-400 text-2xl font-black animate-pulse mt-6">▶ PRÓXIMO A APRESENTAR</p>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA VERMELHA: CHONG apresentando ──────────────────────────────
  if (fase === 'vermelho_apresentando') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 text-white flex flex-col items-center justify-between p-16 select-none">
        <div className="w-full flex justify-between items-center">
          <div className="bg-black/40 px-6 py-3 rounded-full border-2 border-red-500">
            <p className="text-red-300 text-2xl font-black tracking-widest">🔴 CHONG</p>
          </div>
          <p className="text-red-200 text-xl font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-12 opacity-50" />
        </div>

        <div className="bg-black/50 border-4 border-red-400 rounded-3xl px-16 py-6 text-center">
          <p className="text-red-300 text-sm font-black tracking-widest mb-2 uppercase">Poomsae em Execução</p>
          <p className="text-white text-7xl font-black">{matchAtivo?.forma_designada || luta.poomsae_1 || '---'}</p>
        </div>

        <div className="text-center">
          <h1 className="text-[8rem] font-black text-white leading-none"
              style={{textShadow:'0 0 60px rgba(255,100,100,0.8)'}}>
            {nome_vermelho}
          </h1>
          {equipe_vermelho && <p className="text-red-300 text-3xl font-bold mt-4">{equipe_vermelho}</p>}
        </div>

        <div className="flex flex-col items-center">
          <p className="text-red-300 text-xl font-black tracking-widest mb-4">⏱ TEMPO</p>
          <p className={`text-[10rem] font-black tabular-nums leading-none ${timerCritico ? 'text-yellow-300 animate-pulse' : 'text-white'}`}
             style={{textShadow: timerCritico ? '0 0 40px rgba(250,204,21,0.8)' : '0 0 30px rgba(255,255,255,0.3)'}}>
            {timerStr}
          </p>
        </div>
      </div>
    );
  }

  // ── TELA AZUL: HONG apresentando ───────────────────────────────────
  if (fase === 'azul_apresentando') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white flex flex-col items-center justify-between p-16 select-none">
        <div className="w-full flex justify-between items-center">
          <div className="bg-black/40 px-6 py-3 rounded-full border-2 border-blue-500">
            <p className="text-blue-300 text-2xl font-black tracking-widest">🔵 HONG</p>
          </div>
          <p className="text-blue-200 text-xl font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-12 opacity-50" />
        </div>

        <div className="bg-black/50 border-4 border-blue-400 rounded-3xl px-16 py-6 text-center">
          <p className="text-blue-300 text-sm font-black tracking-widest mb-2 uppercase">Poomsae em Execução</p>
          <p className="text-white text-7xl font-black">{matchAtivo?.forma_designada || luta.poomsae_1 || '---'}</p>
        </div>

        <div className="text-center">
          <h1 className="text-[8rem] font-black text-white leading-none"
              style={{textShadow:'0 0 60px rgba(100,150,255,0.8)'}}>
            {nome_azul}
          </h1>
          {equipe_azul && <p className="text-blue-300 text-3xl font-bold mt-4">{equipe_azul}</p>}
        </div>

        <div className="flex flex-col items-center">
          <p className="text-blue-300 text-xl font-black tracking-widest mb-4">⏱ TEMPO</p>
          <p className={`text-[10rem] font-black tabular-nums leading-none ${timerCritico ? 'text-yellow-300 animate-pulse' : 'text-white'}`}
             style={{textShadow: timerCritico ? '0 0 40px rgba(250,204,21,0.8)' : '0 0 30px rgba(255,255,255,0.3)'}}>
            {timerStr}
          </p>
        </div>
      </div>
    );
  }

  // ── TELA RESULTADO: ambos finalizaram ──────────────────────────────
  if (fase === 'resultado') {
    const totalVerm = matchFinalVermelho?.resultado?.pontuacao_final;
    const totalAzul = matchFinalAzul?.resultado?.pontuacao_final;
    const vencedor = totalVerm != null && totalAzul != null
      ? (totalVerm > totalAzul ? 'vermelho' : totalAzul > totalVerm ? 'azul' : 'empate')
      : null;

    const BoxScore = ({ resultado, cor }) => {
      if (!resultado) return null;
      const corText = cor === 'vermelho' ? 'text-red-300' : 'text-blue-300';
      return (
        <div className="flex gap-4 justify-center flex-wrap">
          {resultado.detalhe_acuracia && (
            <div className="bg-black/40 rounded-xl px-6 py-3 text-center">
              <p className={`${corText} text-xs font-black mb-1`}>ACCURACY</p>
              <p className="text-white text-2xl font-black">{resultado.detalhe_acuracia.media?.toFixed(3)}</p>
            </div>
          )}
          {resultado.detalhe_habilidade_tecnica && (
            <div className="bg-black/40 rounded-xl px-6 py-3 text-center">
              <p className={`${corText} text-xs font-black mb-1`}>TÉCNICA</p>
              <p className="text-white text-2xl font-black">{resultado.detalhe_habilidade_tecnica.media?.toFixed(3)}</p>
            </div>
          )}
          {resultado.detalhe_apresentacao && (
            <div className="bg-black/40 rounded-xl px-6 py-3 text-center">
              <p className={`${corText} text-xs font-black mb-1`}>PRESENTATION</p>
              <p className="text-white text-2xl font-black">{resultado.detalhe_apresentacao.media?.toFixed(3)}</p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-black text-white flex flex-col select-none">
        <div className="bg-gray-900 py-4 px-8 flex justify-between items-center border-b-4 border-yellow-400">
          <p className="text-yellow-400 text-2xl font-black tracking-widest">🏆 RESULTADO FINAL</p>
          <p className="text-gray-300 text-lg font-bold">{luta.nome_categoria}</p>
          <img src={omegaLogo} alt="Logo" className="h-10 opacity-60" />
        </div>
        <div className="flex-1 flex">
          {/* Chong */}
          <div className={`flex-1 flex flex-col items-center justify-center gap-8 p-12 ${vencedor === 'vermelho' ? 'bg-red-900' : 'bg-red-950/40'}`}>
            {vencedor === 'vermelho' && (
              <div className="bg-yellow-400 text-black text-2xl font-black px-8 py-3 rounded-full animate-pulse">🥇 VENCEDOR</div>
            )}
            <p className="text-red-300 text-2xl font-black">🔴 CHONG</p>
            <h2 className="text-5xl font-black text-white text-center leading-tight">{nome_vermelho}</h2>
            {equipe_vermelho && <p className="text-red-300 text-xl font-bold">{equipe_vermelho}</p>}
            <p className={`font-black tabular-nums leading-none ${vencedor === 'vermelho' ? 'text-[11rem] text-yellow-400' : 'text-[9rem] text-red-400'}`}
               style={{textShadow: vencedor === 'vermelho' ? '0 0 50px rgba(250,204,21,0.8)' : '0 0 30px rgba(220,38,38,0.5)'}}>
              {totalVerm?.toFixed(3) ?? '--'}
            </p>
            <BoxScore resultado={matchFinalVermelho?.resultado} cor="vermelho" />
          </div>

          <div className="w-2 bg-yellow-400" />

          {/* Hong */}
          <div className={`flex-1 flex flex-col items-center justify-center gap-8 p-12 ${vencedor === 'azul' ? 'bg-blue-900' : 'bg-blue-950/40'}`}>
            {vencedor === 'azul' && (
              <div className="bg-yellow-400 text-black text-2xl font-black px-8 py-3 rounded-full animate-pulse">🥇 VENCEDOR</div>
            )}
            <p className="text-blue-300 text-2xl font-black">🔵 HONG</p>
            <h2 className="text-5xl font-black text-white text-center leading-tight">{nome_azul}</h2>
            {equipe_azul && <p className="text-blue-300 text-xl font-bold">{equipe_azul}</p>}
            <p className={`font-black tabular-nums leading-none ${vencedor === 'azul' ? 'text-[11rem] text-yellow-400' : 'text-[9rem] text-blue-400'}`}
               style={{textShadow: vencedor === 'azul' ? '0 0 50px rgba(250,204,21,0.8)' : '0 0 30px rgba(37,99,235,0.5)'}}>
              {totalAzul?.toFixed(3) ?? '--'}
            </p>
            <BoxScore resultado={matchFinalAzul?.resultado} cor="azul" />
          </div>
        </div>
      </div>
    );
  }

  // ── TELA INICIAL / AGUARDANDO (espera ou entre apresentações) ───────
  const chongJaApresentou = matchesFinalizados.length >= 1;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col select-none">
      <div className="bg-black py-5 px-8 flex justify-between items-center border-b-2 border-gray-800">
        <img src={omegaLogo} alt="Logo" className="h-12 opacity-60" />
        <div className="text-center">
          <p className="text-white text-2xl font-black tracking-widest uppercase">Apresentação Poomsae</p>
          <p className="text-gray-400 text-lg">{luta.nome_categoria}</p>
        </div>
        <div className="bg-gray-800 px-5 py-2 rounded-xl text-center">
          <p className="text-gray-300 font-black text-sm">{luta.poomsae_1}{luta.poomsae_2 ? ` • ${luta.poomsae_2}` : ''}</p>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chong */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-8 p-16 border-r border-gray-800 ${chongJaApresentou ? 'bg-red-950/20' : 'bg-red-950/5'}`}>
          <p className="text-red-400 text-2xl font-black">🔴 CHONG</p>
          <h2 className="text-6xl font-black text-white text-center leading-tight">{nome_vermelho}</h2>
          {equipe_vermelho && <p className="text-red-300 text-xl font-bold">{equipe_vermelho}</p>}
          {chongJaApresentou && matchFinalVermelho?.resultado ? (
            <div className="text-center mt-6">
              <p className="text-red-300 text-sm font-black mb-3 tracking-widest">NOTA PARCIAL</p>
              <p className="text-7xl font-black text-red-400">{matchFinalVermelho.resultado.pontuacao_final?.toFixed(3)}</p>
              <p className="text-green-400 text-xl font-bold mt-3">✓ Apresentação concluída</p>
            </div>
          ) : (
            <p className={`text-3xl font-black mt-6 ${!chongJaApresentou ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}`}>
              {!chongJaApresentou ? '▶ PRÓXIMO A APRESENTAR' : 'Aguardando...'}
            </p>
          )}
        </div>

        <div className="w-px bg-gray-800" />

        {/* Hong */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-16 bg-blue-950/5">
          <p className="text-blue-400 text-2xl font-black">🔵 HONG</p>
          <h2 className="text-6xl font-black text-white text-center leading-tight">{nome_azul}</h2>
          {equipe_azul && <p className="text-blue-300 text-xl font-bold">{equipe_azul}</p>}
          {chongJaApresentou ? (
            <p className="text-yellow-400 text-3xl font-black mt-6 animate-pulse">▶ PRÓXIMO A APRESENTAR</p>
          ) : (
            <p className="text-gray-600 text-2xl font-bold mt-6">Aguardando CHONG...</p>
          )}
        </div>
      </div>
    </div>
  );
}
