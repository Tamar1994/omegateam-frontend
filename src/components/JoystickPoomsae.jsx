import React, { useState, useEffect } from 'react';
import { Volume2, Minus, Plus, Zap } from 'lucide-react';

/**
 * JOYSTICK POOMSAE PROFISSIONAL - Design Omega Team
 * Inspirado em sistemas de scoring profissionais de Taekwondo
 * 
 * LAYOUT:
 * - 3 colunas: ACCURACY | PRESENTATION | TOTAL
 * - Cada coluna bem separada e com visual profissional
 * - Números gigantes e destacados
 * - Deductions em vermelho/verde bem visíveis
 * - Sliders horizontais para critérios de apresentação
 * 
 * FLUXO:
 * 1. Fase 1: Define accuracy com deductions/recuperações
 * 2. Fase 2: Define apresentação com 3 sliders
 * 3. Resultado final quando todos os juízes registram
 */
export function JoystickPoomsae({ luta, usuario, ws, t }) {
  
  if (!luta?.id || !ws?.current) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-gray-400">Aguardando conexão...</p>
      </div>
    );
  }

  // ==========================================
  // STATES
  // ==========================================

  const [fase, setFase] = useState('accuracy');
  const [notaAccuracy, setNotaAccuracy] = useState(4.0);
  
  const [notaVelocidade, setNotaVelocidade] = useState(1.0);
  const [notaRitmo, setNotaRitmo] = useState(1.0);
  const [notaExpressao, setNotaExpressao] = useState(1.0);
  
  const [enviando, setEnviando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  const atletaAtual = luta.atleta_em_apresentacao || 'vermelho';
  const isVermelho = atletaAtual === 'vermelho';
  const nomeathleta = isVermelho ? luta.atleta_vermelho : luta.atleta_azul;

  // ==========================================
  // EFFECTS
  // ==========================================

  // ✅ Entrar em FULLSCREEN + LANDSCAPE no mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        // Tentar travar em landscape
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
            console.log('✅ Orientation locked to landscape');
          } catch (e) {
            console.warn('⚠️ Could not lock orientation:', e);
          }
        }

        // Tentar entrar em fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
          console.log('✅ Entered fullscreen');
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
          console.log('✅ Entered fullscreen (webkit)');
        }
      } catch (e) {
        console.warn('⚠️ Could not enter fullscreen:', e);
      }
    };

    enterFullscreen();

    // Cleanup: Sair de fullscreen ao desmontar
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const dados = JSON.parse(event.data);
        if (dados.tipo === 'poomsae_resultado_final') {
          setResultadoFinal(dados.resultado_final);
          setFase('resultado');
        }
      } catch (e) {
        console.error('Erro ao processar mensagem:', e);
      }
    };

    if (ws?.current) {
      ws.current.addEventListener('message', handleMessage);
      return () => ws.current.removeEventListener('message', handleMessage);
    }
  }, [ws]);

  // ==========================================
  // FUNÇÕES - PHASE 1: ACCURACY
  // ==========================================

  const notaApresentacao = notaVelocidade + notaRitmo + notaExpressao;
  const notaTotal = notaAccuracy + notaApresentacao;

  const adicionarAccuracy = (valor) => {
    const nova = notaAccuracy + valor;
    setNotaAccuracy(Math.min(4.0, Math.max(0, nova)));
  };

  const subtrairAccuracy = (valor) => {
    const nova = notaAccuracy - valor;
    setNotaAccuracy(Math.min(4.0, Math.max(0, nova)));
  };

  const enviarAccuracy = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket desconectado!');
      return;
    }

    setEnviando(true);
    const dados = {
      tipo: 'poomsae_accuracy',
      luta_id: luta.id,
      juiz_email: usuario?.email,
      atletaAtual,
      nota_accuracy: parseFloat(notaAccuracy.toFixed(2)),
      timestamp: new Date().toISOString()
    };

    ws.current.send(JSON.stringify(dados));
    setTimeout(() => {
      setFase('apresentacao');
      setEnviando(false);
    }, 300);
  };

  // ==========================================
  // FUNÇÕES - PHASE 2: APRESENTAÇÃO
  // ==========================================

  const enviarApresentacao = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket desconectado!');
      return;
    }

    setEnviando(true);
    setFase('computando');

    const dados = {
      tipo: 'poomsae_apresentacao',
      luta_id: luta.id,
      juiz_email: usuario?.email,
      atletaAtual,
      nota_velocidade: parseFloat(notaVelocidade.toFixed(2)),
      nota_ritmo: parseFloat(notaRitmo.toFixed(2)),
      nota_expressao: parseFloat(notaExpressao.toFixed(2)),
      timestamp: new Date().toISOString()
    };

    ws.current.send(JSON.stringify(dados));
    setEnviando(false);
  };

  // ==========================================
  // RENDER - FASE 1: ACCURACY (COM NOVO DESIGN)
  // ==========================================

  if (fase === 'accuracy') {
    const accentColor = isVermelho ? 'from-red-800 to-red-900' : 'from-blue-800 to-blue-900';

    return (
      <div className={`h-screen w-screen bg-gradient-to-br ${accentColor} flex flex-col items-center justify-center p-2 overflow-hidden`}>
        <div className="w-full h-full flex flex-col justify-between py-2">
          
          {/* HEADER COM ATLETA */}
          <div className="text-center flex-shrink-0">
            <p className={`${isVermelho ? 'text-red-400' : 'text-blue-400'} text-xs font-black tracking-widest mb-0.5`}>
              {isVermelho ? '🔴 CHONG' : '🔵 HONG'}
            </p>
            <h1 className="text-white font-black text-xl line-clamp-1">{nomeathleta}</h1>
          </div>

          {/* LAYOUT 3 COLUNAS - ACCURACY | PRESENTATION | TOTAL */}
          <div className="grid grid-cols-3 gap-1.5 flex-1 overflow-hidden">
            
            {/* COLUNA 1: ACCURACY */}
            <div className="bg-black/50 rounded-lg p-2 border border-white/20 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black tracking-widest mb-1 text-center leading-none">ACCURACY</p>
                
                <div className="text-center mb-1">
                  <p className={`text-4xl font-black leading-none ${
                    notaAccuracy >= 3.5 ? 'text-green-400' : 
                    notaAccuracy >= 2.0 ? 'text-yellow-400' : 
                    'text-orange-400'
                  }`}>
                    {notaAccuracy.toFixed(1)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Máx: 4</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="bg-red-900/60 rounded p-1 text-center border border-red-600">
                  <p className="text-red-300 font-black text-lg leading-none">-0.3</p>
                  <p className="text-red-200 text-xs font-bold leading-none">GRAVE</p>
                </div>
                <div className="bg-red-900/60 rounded p-1 text-center border border-red-600">
                  <p className="text-red-300 font-black text-lg leading-none">-0.1</p>
                  <p className="text-red-200 text-xs font-bold leading-none">SIMPLES</p>
                </div>
              </div>
            </div>

            {/* COLUNA 2: PRESENTATION (PREVIEW) */}
            <div className="bg-black/50 rounded-lg p-2 border border-white/20 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black tracking-widest mb-1 text-center leading-none">PRESENTATION</p>
                
                <div className="text-center mb-1">
                  <p className="text-yellow-400 text-4xl font-black leading-none">
                    {notaApresentacao.toFixed(1)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Máx: 6</p>
                </div>
              </div>

              <div className="space-y-0.5 text-center text-xs">
                <div className="bg-white/10 rounded p-1">
                  <p className="text-gray-300 leading-none">Vel: {notaVelocidade.toFixed(1)}</p>
                </div>
                <div className="bg-white/10 rounded p-1">
                  <p className="text-gray-300 leading-none">Rit: {notaRitmo.toFixed(1)}</p>
                </div>
                <div className="bg-white/10 rounded p-1">
                  <p className="text-gray-300 leading-none">Exp: {notaExpressao.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* COLUNA 3: TOTAL */}
            <div className="bg-black/50 rounded-lg p-2 border border-omega-red/60 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black tracking-widest mb-1 text-center leading-none">TOTAL</p>
                
                <div className="text-center">
                  <p className="text-white text-4xl font-black leading-none">
                    {notaTotal.toFixed(1)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Max: 10</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="bg-green-900/60 rounded p-1 text-center border border-green-600">
                  <p className="text-green-300 font-black text-lg leading-none">+0.3</p>
                  <p className="text-green-200 text-xs font-bold leading-none">RECUPERAR</p>
                </div>
                <div className="bg-green-900/60 rounded p-1 text-center border border-green-600">
                  <p className="text-green-300 font-black text-lg leading-none">+0.1</p>
                  <p className="text-green-200 text-xs font-bold leading-none">LEVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS DE CONTROLE */}
          <div className="grid grid-cols-4 gap-1 flex-shrink-0">
            <button
              onClick={() => subtrairAccuracy(0.3)}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-2 rounded text-xs border border-red-500 transition-all active:scale-95"
            >
              <Minus size={16} className="mx-auto mb-0.5" />
              -0.3
            </button>
            <button
              onClick={() => subtrairAccuracy(0.1)}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-2 rounded text-xs border border-red-500 transition-all active:scale-95"
            >
              <Minus size={16} className="mx-auto mb-0.5" />
              -0.1
            </button>
            <button
              onClick={() => adicionarAccuracy(0.1)}
              className="bg-green-600 hover:bg-green-500 text-white font-black py-2 rounded text-xs border border-green-500 transition-all active:scale-95"
            >
              <Plus size={16} className="mx-auto mb-0.5" />
              +0.1
            </button>
            <button
              onClick={() => adicionarAccuracy(0.3)}
              className="bg-green-600 hover:bg-green-500 text-white font-black py-2 rounded text-xs border border-green-500 transition-all active:scale-95"
            >
              <Plus size={16} className="mx-auto mb-0.5" />
              +0.3
            </button>
          </div>

          <button
            onClick={enviarAccuracy}
            disabled={enviando}
            className={`w-full py-2 text-sm ${isVermelho ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} rounded font-black text-white tracking-widest uppercase border transition-all disabled:opacity-50 flex-shrink-0`}
          >
            {enviando ? '⏳ Enviando...' : '➜ Próxima Fase'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER - FASE 2: APRESENTAÇÃO (COM SLIDERS)
  // ==========================================

  if (fase === 'apresentacao') {
    const accentColor = isVermelho ? 'from-red-800 to-red-900' : 'from-blue-800 to-blue-900';

    return (
      <div className={`h-screen w-screen bg-gradient-to-br ${accentColor} flex flex-col items-center justify-center p-2 overflow-hidden`}>
        <div className="w-full h-full flex flex-col justify-between py-2">
          
          <div className="text-center flex-shrink-0">
            <p className={`${isVermelho ? 'text-red-400' : 'text-blue-400'} text-xs font-black tracking-widest mb-0.5`}>
              {isVermelho ? '🔴 CHONG' : '🔵 HONG'}
            </p>
            <h1 className="text-white font-black text-xl line-clamp-1">{nomeathleta}</h1>
          </div>

          <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-hidden">
            
            <div className="bg-black/50 rounded-lg p-2 border border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-1 text-center leading-none">ACCURACY</p>
              <p className="text-green-400 text-4xl font-black text-center leading-none">
                {notaAccuracy.toFixed(1)}
              </p>
              <p className="text-gray-500 text-xs mt-1 text-center leading-none">✓ Registrada</p>
            </div>

            <div className="bg-black/50 rounded-lg p-2 border border-yellow-500/60">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-1 text-center leading-none">PRESENTATION</p>
              
              <div className="mb-2">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-yellow-400 font-bold text-xs leading-none">Vel</label>
                  <span className="text-yellow-400 font-black text-lg">{notaVelocidade.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaVelocidade}
                  onChange={(e) => setNotaVelocidade(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="mb-2">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-cyan-400 font-bold text-xs leading-none">Rit</label>
                  <span className="text-cyan-400 font-black text-lg">{notaRitmo.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaRitmo}
                  onChange={(e) => setNotaRitmo(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-purple-400 font-bold text-xs leading-none">Exp</label>
                  <span className="text-purple-400 font-black text-lg">{notaExpressao.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaExpressao}
                  onChange={(e) => setNotaExpressao(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-omega-red/80 rounded p-2 text-center border border-omega-red flex-shrink-0">
            <p className="text-gray-200 text-xs font-black leading-none">SCORE FINAL</p>
            <p className="text-white text-4xl font-black leading-none">
              {notaTotal.toFixed(1)}
            </p>
            <p className="text-gray-300 text-xs mt-0.5 font-bold leading-none">
              = {notaAccuracy.toFixed(1)} + {notaApresentacao.toFixed(1)}
            </p>
          </div>

          <button
            onClick={enviarApresentacao}
            disabled={enviando}
            className={`w-full py-2 text-sm ${isVermelho ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} rounded font-black text-white tracking-widest uppercase border transition-all disabled:opacity-50 flex-shrink-0`}
          >
            {enviando ? '⏳ Enviando...' : '✓ Finalizar Notas'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER - COMPUTANDO
  // ==========================================

  if (fase === 'computando') {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-2 overflow-hidden">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-omega-red rounded-full animate-spin"></div>
            <Zap className="absolute inset-0 m-auto text-omega-red animate-pulse" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white">Processando...</h2>
          <p className="text-gray-300 text-sm">Computando notas de todos os juízes</p>
          <div className="bg-green-900/40 border border-green-500 rounded p-3">
            <p className="text-green-300 font-bold text-sm">✓ Suas notas foram registradas</p>
            <p className="text-green-200 text-xs mt-1">Aguarde o resultado...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER - RESULTADO FINAL
  // ==========================================

  if (fase === 'resultado' && resultadoFinal) {
    const vermelho = resultadoFinal.notas?.vermelho || 0;
    const azul = resultadoFinal.notas?.azul || 0;
    const vencedor = vermelho > azul ? 'vermelho' : azul > vermelho ? 'azul' : 'empate';

    return (
      <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-2 overflow-hidden">
        <div className="w-full h-full flex flex-col justify-between py-2">
          
          <div className="text-center flex-shrink-0">
            <h1 className="text-3xl font-black text-white">🏆 RESULTADO FINAL</h1>
            <p className="text-gray-400 text-xs">Notas Finais Computadas</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-hidden">
            <div className={`${vencedor === 'vermelho' ? 'ring-2 ring-yellow-400 scale-105' : ''} bg-red-900/40 border-2 border-red-600 rounded p-2 text-center transform transition-all flex flex-col justify-between`}>
              <div>
                <h2 className="text-lg font-black text-red-400 mb-0.5">🔴 CHONG</h2>
                <p className="text-gray-300 mb-2 font-bold text-xs line-clamp-1">{luta.atleta_vermelho}</p>
              </div>
              <div className="bg-black/60 rounded p-2 border border-red-600 mb-1">
                <p className="text-gray-400 text-xs font-black leading-none">NOTA FINAL</p>
                <p className="text-4xl font-black text-red-400 leading-none">{vermelho.toFixed(2)}</p>
              </div>
              {vencedor === 'vermelho' && <p className="text-yellow-400 font-black text-sm">👑 VENCEDOR!</p>}
            </div>

            <div className={`${vencedor === 'azul' ? 'ring-2 ring-yellow-400 scale-105' : ''} bg-blue-900/40 border-2 border-blue-600 rounded p-2 text-center transform transition-all flex flex-col justify-between`}>
              <div>
                <h2 className="text-lg font-black text-blue-400 mb-0.5">🔵 HONG</h2>
                <p className="text-gray-300 mb-2 font-bold text-xs line-clamp-1">{luta.atleta_azul}</p>
              </div>
              <div className="bg-black/60 rounded p-2 border border-blue-600 mb-1">
                <p className="text-gray-400 text-xs font-black leading-none">NOTA FINAL</p>
                <p className="text-4xl font-black text-blue-400 leading-none">{azul.toFixed(2)}</p>
              </div>
              {vencedor === 'azul' && <p className="text-yellow-400 font-black text-sm">👑 VENCEDOR!</p>}
            </div>
          </div>

          {vencedor === 'empate' && (
            <div className="bg-yellow-900/40 border border-yellow-500 rounded p-2 text-center flex-shrink-0">
              <p className="text-yellow-400 font-black text-lg">🤝 EMPATE!</p>
              <p className="text-yellow-200 text-xs mt-0.5">Ambos os atletas: {vermelho.toFixed(2)}</p>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded font-black text-white tracking-widest uppercase border transition-all flex-shrink-0"
          >
            ↻ Nova Luta
          </button>
        </div>
      </div>
    );
  }

  return null;
}
