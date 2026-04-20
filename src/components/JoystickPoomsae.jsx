import React, { useState, useEffect } from 'react';
import { Volume2, Minus, Plus, Zap, ChevronUp, ChevronDown } from 'lucide-react';

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

  const [fase, setFase] = useState('accuracy'); // 'accuracy' | 'apresentacao' | 'computando' | 'resultado'
  const [notaAccuracy, setNotaAccuracy] = useState(4.0);
  
  const [notaVelocidade, setNotaVelocidade] = useState(1.0);
  const [notaRitmo, setNotaRitmo] = useState(1.0);
  const [notaExpressao, setNotaExpressao] = useState(1.0);
  
  const [enviando, setEnviando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [historicoNotas, setHistoricoNotas] = useState([]);

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
    
    // Add ao histórico
    setHistoricoNotas([...historicoNotas, {
      accuracy: parseFloat(notaAccuracy.toFixed(2)),
      apresentacao: parseFloat(notaApresentacao.toFixed(2)),
      total: parseFloat(notaTotal.toFixed(2)),
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    setEnviando(false);
  };

  // ==========================================
  // RENDER - FASE 1: ACCURACY (COM NOVO DESIGN)
  // ==========================================

  if (fase === 'accuracy') {
    const bgColor = isVermelho ? 'bg-red-900' : 'bg-blue-900';
    const textColor = isVermelho ? 'text-red-400' : 'text-blue-400';
    const accentColor = isVermelho ? 'from-red-800 to-red-900' : 'from-blue-800 to-blue-900';

    return (
      <div className={`flex-1 bg-gradient-to-br ${accentColor} flex items-center justify-center p-4`}>
        <div className="w-full max-w-2xl space-y-6">
          
          {/* HEADER COM ATLETA */}
          <div className="text-center">
            <p className={`${textColor} text-sm font-black tracking-widest mb-1`}>
              {isVermelho ? '🔴 CHONG (VERMELHO)' : '🔵 HONG (AZUL)'}
            </p>
            <h1 className="text-white font-black text-3xl">{nomeathleta}</h1>
          </div>

          {/* LAYOUT 3 COLUNAS - ACCURACY | PRESENTATION | TOTAL */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* ===== COLUNA 1: ACCURACY ===== */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">ACCURACY</p>
              
              {/* NOTA GIGANTE */}
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

              {/* DEDUCTIONS - Vermelho grande */}
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

            {/* ===== COLUNA 2: PRESENTATION (PREVIEW) ===== */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">PRESENTATION</p>
              
              <div className="text-center mb-6">
                <p className="text-yellow-400 text-6xl font-black">
                  {notaApresentacao.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-2">Máx: 6.00</p>
              </div>

              {/* PREVIEW DOS SLIDERS */}
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

            {/* ===== COLUNA 3: TOTAL ===== */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-omega-red/60">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">TOTAL</p>
              
              <div className="text-center">
                <p className="text-white text-6xl font-black">
                  {notaTotal.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs mt-2">Max: 10.00</p>
              </div>

              {/* RECUPERAÇÃO - Verde grande */}
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

          {/* SUBMIT BUTTON */}
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
    const bgColor = isVermelho ? 'bg-red-900' : 'bg-blue-900';
    const accentColor = isVermelho ? 'from-red-800 to-red-900' : 'from-blue-800 to-blue-900';

    return (
      <div className={`flex-1 bg-gradient-to-br ${accentColor} flex items-center justify-center p-4`}>
        <div className="w-full max-w-2xl space-y-6">
          
          {/* HEADER */}
          <div className="text-center">
            <p className={`${isVermelho ? 'text-red-400' : 'text-blue-400'} text-sm font-black tracking-widest mb-1`}>
              {isVermelho ? '🔴 CHONG (VERMELHO)' : '🔵 HONG (AZUL)'}
            </p>
            <h1 className="text-white font-black text-3xl">{nomeathleta}</h1>
          </div>

          {/* LAYOUT 3 COLUNAS - ACCURACY | PRESENTATION | TOTAL */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* COLUNA 1: ACCURACY (apenas leitura) */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">ACCURACY</p>
              <p className="text-green-400 text-5xl font-black text-center">
                {notaAccuracy.toFixed(1)}
              </p>
              <p className="text-gray-500 text-xs mt-2 text-center">✓ Registrada</p>
            </div>

            {/* COLUNA 2: PRESENTATION (sliders) */}
            <div className="bg-black/50 rounded-2xl p-6 border-2 border-yellow-500/60 col-span-2">
              <p className="text-gray-400 text-xs font-black tracking-widest mb-4 text-center">PRESENTATION (SLIDERS)</p>
              
              {/* Slider 1 - Velocidade */}
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

              {/* Slider 2 - Ritmo */}
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

              {/* Slider 3 - Expressão */}
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

          {/* RESUMO TOTAL */}
          <div className="bg-omega-red/80 rounded-2xl p-6 text-center border-2 border-omega-red">
            <p className="text-gray-200 text-xs font-black mb-2">SCORE FINAL</p>
            <p className="text-white text-6xl font-black">
              {notaTotal.toFixed(1)}
            </p>
            <p className="text-gray-300 text-sm mt-2 font-bold">
              = {notaAccuracy.toFixed(1)} (Accuracy) + {notaApresentacao.toFixed(1)} (Presentation)
            </p>
          </div>

          {/* SUBMIT BUTTON */}
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
            {/* VERMELHO */}
            <div className={`${vencedor === 'vermelho' ? 'ring-4 ring-yellow-400 scale-105' : ''} bg-red-900/40 border-4 border-red-600 rounded-2xl p-8 text-center transform transition-all`}>
              <h2 className="text-3xl font-black text-red-400 mb-2">🔴 CHONG</h2>
              <p className="text-gray-300 mb-6 font-bold">{luta.atleta_vermelho}</p>
              <div className="bg-black/60 rounded-xl p-6 border-2 border-red-600 mb-4">
                <p className="text-gray-400 text-xs font-black mb-2">NOTA FINAL</p>
                <p className="text-7xl font-black text-red-400">{vermelho.toFixed(2)}</p>
              </div>
              {vencedor === 'vermelho' && <p className="text-yellow-400 font-black text-2xl">👑 VENCEDOR!</p>}
            </div>

            {/* AZUL */}
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
import React, { useState, useEffect } from 'react';
import { Minus, Plus, CheckCircle, Clock, Zap } from 'lucide-react';

/**
 * JoystickPoomsae - Sistema de Scoring para Poomsae (RESTRUCTURADO)
 * 
 * NOVO FLUXO:
 * 1. Mostra apenas UM atleta por vez (Chong ou Hong)
 * 2. Árbitro avalia e envia nota
 * 3. Sistema aguarda notas de todos os árbitros
 * 4. Computa: descarta maior e menor, faz média
 * 5. Vai para próximo atleta
 * 6. Ao final, compara as duas médias
 * 
 * AVISOS IMPORTANTES:
 * - Só mostra um atleta por vez para focar a apresentação
 * - "Computando Notas" enquanto aguarda outros árbitros
 * - Resultado final com nota média de todos
 */
export function JoystickPoomsae({ luta, usuario, ws, t }) {
  // ✅ Debug: Verificar props
  useEffect(() => {
    console.log('🎮 JoystickPoomsae MONTADO (NEW):', { luta, usuario, ws: ws?.current, t });
  }, []);

  // ✅ Guard: Se luta não chegou ou não tem dados necessários
  if (!luta || !luta.id) {
    console.warn('⚠️ JoystickPoomsae: Luta inválida:', luta);
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-gray-400 text-lg">Aguardando dados da luta...</p>
      </div>
    );
  }

  // ✅ Guard: Se ws não está disponível
  if (!ws || !ws.current) {
    console.error('❌ JoystickPoomsae: WebSocket não disponível!');
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-red-400 text-lg">Erro: WebSocket não conectado. Tente reconectar.</p>
      </div>
    );
  }

  // ==========================================
  // ESTADOS
  // ==========================================

  // Qual atleta está sendo avaliado agora (começa com 'vermelho')
  const [atletaAtual, setAtletaAtual] = useState(luta.atleta_em_apresentacao || 'vermelho');
  
  // Deduções do atleta atualmente em foco
  const [deducoes, setDeducoes] = useState({
    accuracy: 0,
    speedPower: 0,
    strengthRhythm: 0,
    expressionEnergy: 0,
    accuracyDeduct: 0
  });

  const [notaAtual, setNotaAtual] = useState(10.0);
  
  // Estado de submissão
  const [enviando, setEnviando] = useState(false);
  const [notaEnviada, setNotaEnviada] = useState(false);
  const [computando, setComputando] = useState(false);
  const [notaFinal, setNotaFinal] = useState(null);

  // Resultado final de ambos os atletas (ao final)
  const [resultadoFinal, setResultadoFinal] = useState(null);

  // Botões de deduções disponíveis
  const deducoes_botoes = [
    { label: '-0.1', valor: 0.1 },
    { label: '-0.2', valor: 0.2 },
    { label: '-0.3', valor: 0.3 }
  ];

  // Critérios de avaliação
  const criterios = [
    { key: 'accuracy', label: 'Accuracy', descricao: 'Precisão' },
    { key: 'speedPower', label: 'Speed & Power', descricao: 'Velocidade e Potência' },
    { key: 'strengthRhythm', label: 'Strength/Rhythm', descricao: 'Força/Ritmo' },
    { key: 'expressionEnergy', label: 'Expression', descricao: 'Expressão de Energia' },
    { key: 'accuracyDeduct', label: 'Accuracy D.', descricao: 'Dedução de Precisão' }
  ];

  // Listener para mensagens WebSocket (recebe resultado da computação)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const dados = JSON.parse(event.data);
        
        // Se receber resultado da computação de notas
        if (dados.tipo === 'poomsae_notas_computadas') {
          console.log('📊 NOTAS COMPUTADAS RECEBIDAS:', dados);
          
          // Mostrar tela de resultado
          setComputando(false);
          setNotaFinal(dados.nota_final);
          
          // Se for o segundo atleta, mostra resultado final
          if (dados.proximo_atletaAtual === null) {
            console.log('🏆 RESULTADO FINAL:', dados);
            setResultadoFinal(dados.resultado_final);
          }
        }
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e);
      }
    };

    if (ws?.current) {
      ws.current.addEventListener('message', handleMessage);
      return () => ws.current.removeEventListener('message', handleMessage);
    }
  }, [ws]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const calcularNota = (ded) => {
    const totalDeducoes = Object.values(ded).reduce((a, b) => a + b, 0);
    const nota = Math.max(0, 10.0 - totalDeducoes);
    return nota.toFixed(2);
  };

  const adicionarDeducao = (criterio, valor) => {
    const novasDeducoes = { ...deducoes };
    novasDeducoes[criterio] = (novasDeducoes[criterio] || 0) + valor;
    novasDeducoes[criterio] = Math.min(10, novasDeducoes[criterio]);
    setDeducoes(novasDeducoes);
    setNotaAtual(parseFloat(calcularNota(novasDeducoes)));
  };

  const removerDeducao = (criterio, valor) => {
    const novasDeducoes = { ...deducoes };
    novasDeducoes[criterio] = Math.max(0, (novasDeducoes[criterio] || 0) - valor);
    setDeducoes(novasDeducoes);
    setNotaAtual(parseFloat(calcularNota(novasDeducoes)));
  };

  const resetarAvaliacao = () => {
    setDeducoes({
      accuracy: 0,
      speedPower: 0,
      strengthRhythm: 0,
      expressionEnergy: 0,
      accuracyDeduct: 0
    });
    setNotaAtual(10.0);
    setNotaEnviada(false);
  };

  // ==========================================
  // ENVIAR NOTA
  // ==========================================

  const enviarNota = async () => {
    try {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket não conectado!');
        alert('Erro: WebSocket desconectado. Reconecte e tente novamente.');
        return;
      }

      setEnviando(true);
      setComputando(true);

      const dados = {
        tipo: 'poomsae_nota',
        luta_id: luta.id,
        juiz_email: usuario?.email,
        atletaAtual, // 'vermelho' ou 'azul'
        nota: parseFloat(notaAtual),
        deducoes,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Enviando nota Poomsae:', dados);
      ws.current.send(JSON.stringify(dados));
      
      setNotaEnviada(true);
    } catch (error) {
      console.error('❌ Erro ao enviar nota:', error);
      alert('Erro ao enviar nota. Verifique a conexão.');
      setEnviando(false);
      setComputando(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  // Se houver resultado final, mostra comparação
  if (resultadoFinal) {
    const vermelho_nota = resultadoFinal.notas.vermelho;
    const azul_nota = resultadoFinal.notas.azul;
    const vencedor = vermelho_nota > azul_nota ? 'vermelho' : azul_nota > vermelho_nota ? 'azul' : 'empate';

    return (
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-2">🏆 RESULTADO FINAL</h1>
            <p className="text-gray-400 text-sm">Poomsae - Todas as notas computadas</p>
          </div>

          {/* Comparação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vermelho */}
            <div className={`${vencedor === 'vermelho' ? 'ring-4 ring-yellow-400' : ''} bg-red-900/30 border-4 border-red-600 rounded-2xl p-6 text-center`}>
              <h2 className="text-2xl font-black text-red-400 mb-2">🔴 CHONG (Vermelho)</h2>
              <p className="text-gray-400 mb-4">{luta.atleta_vermelho}</p>
              <div className="bg-black/40 rounded-xl p-4 border border-red-600">
                <p className="text-gray-400 text-xs font-bold mb-1">NOTA FINAL</p>
                <p className="text-5xl font-black text-red-400">{vermelho_nota.toFixed(2)}</p>
              </div>
              {vencedor === 'vermelho' && (
                <p className="mt-4 text-yellow-400 font-black text-lg">👑 VENCEDOR!</p>
              )}
            </div>

            {/* Azul */}
            <div className={`${vencedor === 'azul' ? 'ring-4 ring-yellow-400' : ''} bg-blue-900/30 border-4 border-blue-600 rounded-2xl p-6 text-center`}>
              <h2 className="text-2xl font-black text-blue-400 mb-2">🔵 HONG (Azul)</h2>
              <p className="text-gray-400 mb-4">{luta.atleta_azul}</p>
              <div className="bg-black/40 rounded-xl p-4 border border-blue-600">
                <p className="text-gray-400 text-xs font-bold mb-1">NOTA FINAL</p>
                <p className="text-5xl font-black text-blue-400">{azul_nota.toFixed(2)}</p>
              </div>
              {vencedor === 'azul' && (
                <p className="mt-4 text-yellow-400 font-black text-lg">👑 VENCEDOR!</p>
              )}
            </div>
          </div>

          {vencedor === 'empate' && (
            <div className="bg-yellow-900/30 border-4 border-yellow-600 rounded-2xl p-6 text-center">
              <p className="text-yellow-400 font-black text-xl">🤝 EMPATE!</p>
              <p className="text-gray-400 mt-2">Ambos os atletas receberam a mesma nota final.</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700 text-center text-xs text-gray-400">
            Poomsae finalizado. Aguarde instruções do mesário para a próxima luta.
          </div>
        </div>
      </div>
    );
  }

  // Se está computando, mostra tela de espera
  if (computando && notaEnviada) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-omega-red rounded-full animate-spin"></div>
            <Zap className="absolute inset-0 m-auto text-omega-red animate-pulse" size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">⏳ Computando Notas...</h2>
            <p className="text-gray-400">Aguardando notas dos outros árbitros...</p>
          </div>
          <div className="bg-blue-900/30 border-2 border-blue-600 rounded-lg p-4">
            <p className="text-blue-400 font-semibold">ℹ️ Sua nota foi registrada</p>
            <p className="text-gray-400 text-sm mt-2">{notaAtual.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Se já enviou e está esperando
  if (notaEnviada && !computando) {
    const isVermelho = atletaAtual === 'vermelho';
    const corBg = isVermelho ? 'bg-red-900/30 border-red-600' : 'bg-blue-900/30 border-blue-600';
    const corText = isVermelho ? 'text-red-400' : 'text-blue-400';

    return (
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-white mb-2">✅ Nota Registrada!</h1>
            <p className="text-gray-400">Aguardando próxima avaliação...</p>
          </div>

          {/* Card com resultado */}
          <div className={`${corBg} border-4 rounded-2xl p-8 text-center`}>
            <h2 className={`text-2xl font-black ${corText} mb-4`}>
              {isVermelho ? '🔴 Chong (Vermelho)' : '🔵 Hong (Azul)'}
            </h2>
            <div className="bg-black/40 rounded-xl p-6 border border-gray-700 mb-6">
              <p className="text-gray-400 text-sm font-bold mb-2">SUA AVALIAÇÃO</p>
              <p className={`text-6xl font-black ${corText}`}>{notaAtual.toFixed(2)}</p>
            </div>
            <div className="flex justify-center gap-3 mb-4">
              <CheckCircle className={corText} size={32} />
              <Clock className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-400 text-sm">Aguardando outros árbitros...</p>
          </div>

          {/* Info */}
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700 text-center text-xs text-gray-400">
            💡 Mantenha o aplicativo aberto para receber atualizações em tempo real
          </div>
        </div>
      </div>
    );
  }

  // RENDER NORMAL: Formulário de avaliação
  const isVermelho = atletaAtual === 'vermelho';
  const atleta = isVermelho ? luta.atleta_vermelho : luta.atleta_azul;
  const corBg = isVermelho ? 'bg-red-900/30 border-red-600' : 'bg-blue-900/30 border-blue-600';
  const corText = isVermelho ? 'text-red-400' : 'text-blue-400';
  const corBotao = isVermelho ? 'bg-red-600 hover:bg-red-500 border-red-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400';

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-1">SISTEMA DE SCORING POOMSAE</h1>
          <p className="text-gray-400 text-sm">Avaliando um atleta por vez</p>
        </div>

        {/* Painel de Avaliação */}
        <div className={`${corBg} border-4 rounded-2xl p-6 space-y-4`}>
          {/* Título e Atleta */}
          <div className="text-center">
            <h2 className={`text-2xl font-black ${corText} mb-1`}>
              {isVermelho ? '🔴 Chong (Vermelho)' : '🔵 Hong (Azul)'}
            </h2>
            <p className={`text-sm ${corText} opacity-80`}>{atleta}</p>
          </div>

          {/* Nota Final Grande */}
          <div className="bg-black/40 rounded-xl p-4 text-center border border-gray-700">
            <p className="text-gray-400 text-xs font-bold mb-1">NOTA FINAL</p>
            <p className={`text-5xl font-black tabular-nums ${
              notaAtual >= 8 ? 'text-green-400' : notaAtual >= 7 ? 'text-yellow-400' : 'text-orange-400'
            }`}>
              {notaAtual.toFixed(2)}
            </p>
          </div>

          {/* Critérios de Deduções */}
          <div className="space-y-3">
            {criterios.map(criterio => (
              <div key={criterio.key} className="bg-black/40 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-sm text-gray-200">{criterio.label}</p>
                    <p className="text-xs text-gray-400">{criterio.descricao}</p>
                  </div>
                  <p className="text-lg font-black text-gray-300">
                    -{(deducoes[criterio.key] || 0).toFixed(2)}
                  </p>
                </div>

                {/* Botões de Deduções */}
                <div className="flex gap-2">
                  {deducoes_botoes.map((ded, idx) => (
                    <button
                      key={idx}
                      onClick={() => adicionarDeducao(criterio.key, ded.valor)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border-2 ${corBotao} text-white active:scale-95`}
                    >
                      <Plus size={12} className="inline mr-1" />
                      {ded.label}
                    </button>
                  ))}

                  {/* Botão de Remover */}
                  {(deducoes[criterio.key] || 0) > 0 && (
                    <button
                      onClick={() => removerDeducao(criterio.key, 0.1)}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600 transition-all active:scale-95"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button
              onClick={resetarAvaliacao}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all border-2 border-gray-600"
            >
              🔄 Resetar
            </button>
            <button
              onClick={enviarNota}
              disabled={enviando}
              className={`flex-1 py-4 ${corBotao} rounded-xl font-black text-lg tracking-widest uppercase transition-all transform hover:scale-105 active:scale-95 shadow-2xl border-2 text-white disabled:opacity-50`}
            >
              {enviando ? '⏳ Enviando...' : '✓ Enviar Nota'}
            </button>
          </div>
        </div>

        {/* Footer com Info */}
        <div className="bg-black/40 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-xs text-gray-400">
            💡 Comece com 10.0 e deduz conforme os critérios. Mínimo 0.0. Sua nota será registrada em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
