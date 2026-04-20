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
