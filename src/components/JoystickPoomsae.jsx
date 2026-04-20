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
      <div className={`flex-1 bg-gradient-to-br ${accentColor} flex items-center justify-center p-4`}>
        <div className="w-full max-w-2xl space-y-6">
          
          {/* HEADER COM ATLETA */}
          <div className="text-center">
            <p className={`${isVermelho ? 'text-red-400' : 'text-blue-400'} text-sm font-black tracking-widest mb-1`}>
              {isVermelho ? '🔴 CHONG (VERMELHO)' : '🔵 HONG (AZUL)'}
            </p>
            <h1 className="text-white font-black text-3xl">{nomeathleta}</h1>
          </div>

          {/* LAYOUT 3 COLUNAS - ACCURACY | PRESENTATION | TOTAL */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* COLUNA 1: ACCURACY */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">ACCURACY</p>
              
              <div className="text-center mb-6">
                <p className={`text-6xl font-black ${
                  notaAccuracy >= 3.5 ? 'text-green-400' : 
                  notaAccuracy >= 2.0 ? 'text-yellow-400' : 
                  'text-orange-400'
                }`}>
                  {notaAccuracy.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-2">Máx: 4.00</p>
              </div>

              <div className="space-y-2">
                <div className="bg-red-900/60 rounded-lg p-3 text-center border-2 border-red-600">
                  <p className="text-red-300 font-black text-3xl">-0.3</p>
                  <p className="text-red-200 text-xs font-bold">GRAVE</p>
                </div>
                <div className="bg-red-900/60 rounded-lg p-3 text-center border-2 border-red-600">
                  <p className="text-red-300 font-black text-3xl">-0.1</p>
                  <p className="text-red-200 text-xs font-bold">SIMPLES</p>
                </div>
              </div>
            </div>

            {/* COLUNA 2: PRESENTATION (PREVIEW) */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">PRESENTATION</p>
              
              <div className="text-center mb-6">
                <p className="text-yellow-400 text-6xl font-black">
                  {notaApresentacao.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-2">Máx: 6.00</p>
              </div>

              <div className="space-y-1 text-center text-xs">
                <div className="bg-white/10 rounded p-2">
                  <p className="text-gray-300">Vel: {notaVelocidade.toFixed(1)}</p>
                </div>
                <div className="bg-white/10 rounded p-2">
                  <p className="text-gray-300">Rit: {notaRitmo.toFixed(1)}</p>
                </div>
                <div className="bg-white/10 rounded p-2">
                  <p className="text-gray-300">Exp: {notaExpressao.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* COLUNA 3: TOTAL */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-omega-red/60">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">TOTAL</p>
              
              <div className="text-center">
                <p className="text-white text-6xl font-black">
                  {notaTotal.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-2">Max: 10.00</p>
              </div>

              <div className="space-y-2 mt-6">
                <div className="bg-green-900/60 rounded-lg p-3 text-center border-2 border-green-600">
                  <p className="text-green-300 font-black text-3xl">+0.3</p>
                  <p className="text-green-200 text-xs font-bold">RECUPERAR</p>
                </div>
                <div className="bg-green-900/60 rounded-lg p-3 text-center border-2 border-green-600">
                  <p className="text-green-300 font-black text-3xl">+0.1</p>
                  <p className="text-green-200 text-xs font-bold">LEVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS DE CONTROLE */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => subtrairAccuracy(0.3)}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-lg border-2 border-red-500 transition-all active:scale-95"
            >
              <Minus size={20} className="mx-auto mb-1" />
              -0.3
            </button>
            <button
              onClick={() => subtrairAccuracy(0.1)}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-lg border-2 border-red-500 transition-all active:scale-95"
            >
              <Minus size={20} className="mx-auto mb-1" />
              -0.1
            </button>
            <button
              onClick={() => adicionarAccuracy(0.1)}
              className="bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-lg border-2 border-green-500 transition-all active:scale-95"
            >
              <Plus size={20} className="mx-auto mb-1" />
              +0.1
            </button>
            <button
              onClick={() => adicionarAccuracy(0.3)}
              className="bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-lg border-2 border-green-500 transition-all active:scale-95"
            >
              <Plus size={20} className="mx-auto mb-1" />
              +0.3
            </button>
          </div>

          <button
            onClick={enviarAccuracy}
            disabled={enviando}
            className={`w-full py-5 ${isVermelho ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} rounded-xl font-black text-xl text-white tracking-widest uppercase border-2 transition-all disabled:opacity-50`}
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
      <div className={`flex-1 bg-gradient-to-br ${accentColor} flex items-center justify-center p-4`}>
        <div className="w-full max-w-2xl space-y-6">
          
          <div className="text-center">
            <p className={`${isVermelho ? 'text-red-400' : 'text-blue-400'} text-sm font-black tracking-widest mb-1`}>
              {isVermelho ? '🔴 CHONG (VERMELHO)' : '🔵 HONG (AZUL)'}
            </p>
            <h1 className="text-white font-black text-3xl">{nomeathleta}</h1>
          </div>

          <div className="grid grid-cols-3 gap-4">
            
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">ACCURACY</p>
              <p className="text-green-400 text-5xl font-black text-center">
                {notaAccuracy.toFixed(1)}
              </p>
              <p className="text-gray-500 text-xs mt-2 text-center">✓ Registrada</p>
            </div>

            <div className="bg-black/50 rounded-2xl p-6 border-2 border-yellow-500/60 col-span-2">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">PRESENTATION (SLIDERS)</p>
              
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-yellow-400 font-bold text-sm">Velocidade & Força</label>
                  <span className="text-yellow-400 font-black text-2xl">{notaVelocidade.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaVelocidade}
                  onChange={(e) => setNotaVelocidade(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-cyan-400 font-bold text-sm">Ritmo / Tempo</label>
                  <span className="text-cyan-400 font-black text-2xl">{notaRitmo.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaRitmo}
                  onChange={(e) => setNotaRitmo(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-purple-400 font-bold text-sm">Expressão de Energia</label>
                  <span className="text-purple-400 font-black text-2xl">{notaExpressao.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={notaExpressao}
                  onChange={(e) => setNotaExpressao(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-omega-red/80 rounded-2xl p-6 text-center border-2 border-omega-red">
            <p className="text-gray-200 text-xs font-black mb-2">SCORE FINAL</p>
            <p className="text-white text-6xl font-black">
              {notaTotal.toFixed(1)}
            </p>
            <p className="text-gray-300 text-sm mt-2 font-bold">
              = {notaAccuracy.toFixed(1)} (Accuracy) + {notaApresentacao.toFixed(1)} (Presentation)
            </p>
          </div>

          <button
            onClick={enviarApresentacao}
            disabled={enviando}
            className={`w-full py-5 ${isVermelho ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} rounded-xl font-black text-xl text-white tracking-widest uppercase border-2 transition-all disabled:opacity-50`}
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
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-omega-red rounded-full animate-spin"></div>
            <Zap className="absolute inset-0 m-auto text-omega-red animate-pulse" size={48} />
          </div>
          <h2 className="text-3xl font-black text-white">Processando...</h2>
          <p className="text-gray-300">Computando notas de todos os juízes</p>
          <div className="bg-green-900/40 border-2 border-green-500 rounded-lg p-4">
            <p className="text-green-300 font-bold">✓ Suas notas foram registradas</p>
            <p className="text-green-200 text-sm mt-2">Aguarde o resultado...</p>
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
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2">🏆 RESULTADO FINAL</h1>
            <p className="text-gray-400">Poomsae - Notas Finais Computadas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${vencedor === 'vermelho' ? 'ring-4 ring-yellow-400 scale-105' : ''} bg-red-900/40 border-4 border-red-600 rounded-2xl p-8 text-center transform transition-all`}>
              <h2 className="text-3xl font-black text-red-400 mb-2">🔴 CHONG</h2>
              <p className="text-gray-300 mb-6 font-bold">{luta.atleta_vermelho}</p>
              <div className="bg-black/60 rounded-xl p-6 border-2 border-red-600 mb-4">
                <p className="text-gray-400 text-xs font-black mb-2">NOTA FINAL</p>
                <p className="text-7xl font-black text-red-400">{vermelho.toFixed(2)}</p>
              </div>
              {vencedor === 'vermelho' && <p className="text-yellow-400 font-black text-2xl">👑 VENCEDOR!</p>}
            </div>

            <div className={`${vencedor === 'azul' ? 'ring-4 ring-yellow-400 scale-105' : ''} bg-blue-900/40 border-4 border-blue-600 rounded-2xl p-8 text-center transform transition-all`}>
              <h2 className="text-3xl font-black text-blue-400 mb-2">🔵 HONG</h2>
              <p className="text-gray-300 mb-6 font-bold">{luta.atleta_azul}</p>
              <div className="bg-black/60 rounded-xl p-6 border-2 border-blue-600 mb-4">
                <p className="text-gray-400 text-xs font-black mb-2">NOTA FINAL</p>
                <p className="text-7xl font-black text-blue-400">{azul.toFixed(2)}</p>
              </div>
              {vencedor === 'azul' && <p className="text-yellow-400 font-black text-2xl">👑 VENCEDOR!</p>}
            </div>
          </div>

          {vencedor === 'empate' && (
            <div className="bg-yellow-900/40 border-4 border-yellow-500 rounded-2xl p-8 text-center">
              <p className="text-yellow-400 font-black text-3xl">🤝 EMPATE!</p>
              <p className="text-yellow-200 mt-2">Ambos os atletas: {vermelho.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
