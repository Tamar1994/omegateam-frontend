import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * JoystickPoomsae - Sistema de Scoring para Poomsae
 * 
 * Baseado em regras WT:
 * - Accuracy (Precisão)
 * - Speed & Power (Velocidade e Potência)
 * - Strength/Speed/Rhythm (Força/Velocidade/Ritmo)
 * - Expression of Energy (Expressão de Energia)
 * - Accuracy Deduct (Dedução de Precisão)
 */
export function JoystickPoomsae({ luta, usuario, ws, t }) {
  // ✅ Debug: Verificar props
  useEffect(() => {
    console.log('🎮 JoystickPoomsae MONTADO:', { luta, usuario, ws: ws?.current, t });
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

  const [dedutoesVermelho, setDedutoesVermelho] = useState({
    accuracy: 0,
    speedPower: 0,
    strengthRhythm: 0,
    expressionEnergy: 0,
    accuracyDeduct: 0
  });

  const [dedutoesAzul, setDedutoesAzul] = useState({
    accuracy: 0,
    speedPower: 0,
    strengthRhythm: 0,
    expressionEnergy: 0,
    accuracyDeduct: 0
  });

  const [notaVermelho, setNotaVermelho] = useState(10.0);
  const [notaAzul, setNotaAzul] = useState(10.0);

  // Botões de deduções disponíveis
  const deducoes = [
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

  const calcularNota = (deducoes) => {
    const totalDeducoes = Object.values(deducoes).reduce((a, b) => a + b, 0);
    const nota = Math.max(0, 10.0 - totalDeducoes);
    return nota.toFixed(2);
  };

  const adicionarDeducao = (cor, criterio, valor) => {
    if (cor === 'vermelho') {
      const novasDeducoes = { ...dedutoesVermelho };
      novasDeducoes[criterio] = (novasDeducoes[criterio] || 0) + valor;
      // Limitar a 10 (mínimo de 0)
      novasDeducoes[criterio] = Math.min(10, novasDeducoes[criterio]);
      setDedutoesVermelho(novasDeducoes);
      setNotaVermelho(parseFloat(calcularNota(novasDeducoes)));
    } else {
      const novasDeducoes = { ...dedutoesAzul };
      novasDeducoes[criterio] = (novasDeducoes[criterio] || 0) + valor;
      novasDeducoes[criterio] = Math.min(10, novasDeducoes[criterio]);
      setDedutoesAzul(novasDeducoes);
      setNotaAzul(parseFloat(calcularNota(novasDeducoes)));
    }
  };

  const removerDeducao = (cor, criterio, valor) => {
    if (cor === 'vermelho') {
      const novasDeducoes = { ...dedutoesVermelho };
      novasDeducoes[criterio] = Math.max(0, (novasDeducoes[criterio] || 0) - valor);
      setDedutoesVermelho(novasDeducoes);
      setNotaVermelho(parseFloat(calcularNota(novasDeducoes)));
    } else {
      const novasDeducoes = { ...dedutoesAzul };
      novasDeducoes[criterio] = Math.max(0, (novasDeducoes[criterio] || 0) - valor);
      setDedutoesAzul(novasDeducoes);
      setNotaAzul(parseFloat(calcularNota(novasDeducoes)));
    }
  };

  const enviarNota = (cor) => {
    try {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket não conectado! ReadyState:', ws.current?.readyState);
        alert('Erro: WebSocket desconectado. Reconecte e tente novamente.');
        return;
      }

      const deducoes = cor === 'vermelho' ? dedutoesVermelho : dedutoesAzul;
      const nota = cor === 'vermelho' ? notaVermelho : notaAzul;

      const dados = {
        tipo: 'poomsae_nota',
        luta_id: luta.id,
        juiz_email: usuario?.email,
        cor,
        nota: parseFloat(nota),
        deducoes,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Enviando nota Poomsae:', dados);
      ws.current.send(JSON.stringify(dados));
    } catch (error) {
      console.error('❌ Erro ao enviar nota:', error);
      alert('Erro ao enviar nota. Verifique a conexão.');
    }
  };

  const renderizarCor = (cor) => {
    const isVermelho = cor === 'vermelho';
    const deducoes = isVermelho ? dedutoesVermelho : dedutoesAzul;
    const nota = isVermelho ? notaVermelho : notaAzul;
    const corBg = isVermelho ? 'bg-red-900/30 border-red-600' : 'bg-blue-900/30 border-blue-600';
    const corText = isVermelho ? 'text-red-400' : 'text-blue-400';
    const corBotao = isVermelho ? 'bg-red-600 hover:bg-red-500 border-red-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400';

    return (
      <div key={cor} className={`flex-1 ${corBg} border-4 rounded-2xl p-6 space-y-4`}>
        {/* Título e Atleta */}
        <div className="text-center">
          <h2 className={`text-2xl font-black ${corText} mb-1`}>
            {cor === 'vermelho' ? '🔴 Vermelho (Chong)' : '🔵 Azul (Hong)'}
          </h2>
          <p className={`text-sm ${corText} opacity-80`}>
            {cor === 'vermelho' ? luta.atleta_vermelho : luta.atleta_azul}
          </p>
        </div>

        {/* Nota Final Grande */}
        <div className="bg-black/40 rounded-xl p-4 text-center border border-gray-700">
          <p className="text-gray-400 text-xs font-bold mb-1">NOTA FINAL</p>
          <p className={`text-5xl font-black tabular-nums ${
            nota >= 8 ? 'text-green-400' : nota >= 7 ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            {nota.toFixed(2)}
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
                {deducoes.map((ded, idx) => (
                  <button
                    key={idx}
                    onClick={() => adicionarDeducao(cor, criterio.key, ded.valor)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border-2 ${corBotao} text-white active:scale-95`}
                  >
                    <Plus size={12} className="inline mr-1" />
                    {ded.label}
                  </button>
                ))}

                {/* Botão de Remover */}
                {(deducoes[criterio.key] || 0) > 0 && (
                  <button
                    onClick={() => removerDeducao(cor, criterio.key, 0.1)}
                    className="py-2 px-3 rounded-lg text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600 transition-all active:scale-95"
                  >
                    <Minus size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botão Enviar */}
        <button
          onClick={() => enviarNota(cor)}
          className={`w-full py-4 ${corBotao} rounded-xl font-black text-lg tracking-widest uppercase transition-all transform hover:scale-105 active:scale-95 shadow-2xl border-2 text-white`}
        >
          ✓ Enviar Nota
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-6xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-1">SISTEMA DE SCORING POOMSAE</h1>
          <p className="text-gray-400 text-sm">Selecione as deduções para cada critério</p>
        </div>

        {/* Grid com Vermelho e Azul */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderizarCor('vermelho')}
          {renderizarCor('azul')}
        </div>

        {/* Footer com Info */}
        <div className="bg-black/40 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-xs text-gray-400">
            💡 Comece com 10.0 e deduz conforme os critérios. Mínimo 0.0. 
            Cada nota é enviada ao mesário em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
