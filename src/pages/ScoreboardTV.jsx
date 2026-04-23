import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import omegaLogo from '../assets/omega-logo.png';

export function ScoreboardTV() {
  const { id, quadra } = useParams(); // Puxa o ID do camp e o número da quadra da URL
  
  const [lutaAtual, setLutaAtual] = useState(null);
  const [tempoLuta, setTempoLuta] = useState("00:00");
  const [poomsaeMatchAtivo, setPoomsaeMatchAtivo] = useState(null); // match Em Andamento (real-time sync)
  
  // ==========================================
  // ESTADOS DE ANIMAÇÃO PARA POOMSAE
  // ==========================================
  const [faseAnimacao, setFaseAnimacao] = useState('espera'); // 'espera', 'base', 'juizes', 'resultado'
  const [notasSimuladas, setNotasSimuladas] = useState([]);
  const [notaFinalPoomsae, setNotaFinalPoomsae] = useState("0.00");

  // ==========================================
  // POLLING: BUSCAR DADOS DA QUADRA
  // ==========================================
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/quadras/${quadra}/luta-atual`);
        if (res.ok) {
          const dados = await res.json();
          setLutaAtual(dados);
          
          // O tempo viria do banco num sistema com WebSockets. 
          // Como estamos em polling, vamos colocar um placeholder ou ler se o backend enviasse.
          // Para o visual ficar perfeito, assumimos que o Mesário manda o tempo atualizado.
          setTempoLuta(dados.tempo_restante || "01:30"); 

          // Gatilho da Animação do Poomsae
          if (dados.modalidade === 'Poomsae' && dados.status === 'encerrada' && faseAnimacao === 'espera') {
            iniciarAnimacaoPoomsae(dados.vencedor === 'red' ? dados.placar_red : dados.placar_blue);
          }
        } else {
          setLutaAtual(null);
        }
      } catch (e) {
        console.error("Erro ao buscar Placar");
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 5000); // 5s: TV display não precisa de 2s
    return () => clearInterval(intervalo);
  }, [id, quadra, faseAnimacao]);

  // ==========================================
  // POLLING: MATCH POOMSAE ATIVO (QUEM ESTÁ APRESENTANDO)
  // ==========================================
  useEffect(() => {
    if (!lutaAtual?._id || lutaAtual?.modalidade !== 'Poomsae') {
      setPoomsaeMatchAtivo(null);
      return;
    }
    const buscarMatch = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/poomsae/matches?luta_id=${lutaAtual._id}&status=Em%20Andamento`);
        if (res.ok) {
          const matches = await res.json();
          setPoomsaeMatchAtivo(matches.length > 0 ? matches[0] : null);
        }
      } catch (_) {}
    };
    buscarMatch();
    const intervalo = setInterval(buscarMatch, 3000);
    return () => clearInterval(intervalo);
  }, [lutaAtual?._id, lutaAtual?.modalidade]);

  // ==========================================
  // MÁQUINA DE ANIMAÇÃO DO POOMSAE
  // ==========================================
  const iniciarAnimacaoPoomsae = (notaFinal) => {
    // 1. Mostrar as notas base amarelas (4.0 e 6.0)
    setFaseAnimacao('base');
    
    setTimeout(() => {
      // 2. Gerar 5 notas fakes que a média dê a nota final (Apenas para visualização enquanto não temos websockets dos 5 juízes)
      const base = parseFloat(notaFinal) || 7.0;
      let notas = [
        (base + 0.3).toFixed(2), // Maior (Será cortada)
        (base - 0.2).toFixed(2), // Menor (Será cortada)
        (base + 0.1).toFixed(2),
        (base - 0.1).toFixed(2),
        base.toFixed(2)
      ];
      
      // Ordena para facilitar o corte visual
      notas.sort((a, b) => parseFloat(b) - parseFloat(a));
      
      setNotasSimuladas([
        { id: 1, val: notas[2], cortada: false },
        { id: 2, val: notas[0], cortada: true },  // Maior
        { id: 3, val: notas[3], cortada: false },
        { id: 4, val: notas[4], cortada: true },  // Menor
        { id: 5, val: notas[1], cortada: false }
      ]);
      
      setFaseAnimacao('juizes');

      // 3. Mostrar o resultado final após 2 segundos
      setTimeout(() => {
        setNotaFinalPoomsae(notaFinal.toFixed(2));
        setFaseAnimacao('resultado');
      }, 2500);

    }, 2000); // Fica 2s na nota amarela base
  };

  // ==========================================
  // RENDERIZAÇÃO: STANDBY
  // ==========================================
  if (!lutaAtual) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <img src={omegaLogo} alt="Logo" className="h-32 mb-8 opacity-50" />
        <h1 className="text-5xl font-black text-gray-700 tracking-widest uppercase">Quadra {quadra}</h1>
        <p className="text-2xl text-gray-600 mt-4">Aguardando início da próxima luta...</p>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: POOMSAE
  // ==========================================
  if (lutaAtual.modalidade === 'Poomsae') {
    // Use turno_poomsae to determine who's up (saved by MesarioPanel via salvarTurnoPoomsae)
    const turno = lutaAtual.turno_poomsae || 'chong_p1';
    const isChong = !turno?.startsWith('hong');
    const atletaAtivo = isChong ? lutaAtual.atleta_vermelho : lutaAtual.atleta_azul;
    const nomeAtleta = atletaAtivo?.split(' (')[0] || '—';
    const equipeAtleta = atletaAtivo?.includes('(') ? atletaAtivo.split('(')[1].replace(')', '') : '';
    const poomsaeNome = lutaAtual.poomsae_1;
    const corBg = isChong ? 'from-red-950 via-gray-950 to-black' : 'from-blue-950 via-gray-950 to-black';
    const corBorda = isChong ? 'border-red-600' : 'border-blue-600';
    const corTexto = isChong ? 'text-red-400' : 'text-blue-400';
    const corLabel = isChong ? '🔴 CHONG' : '🔵 HONG';

    // When no active match, show waiting/standby
    if (!poomsaeMatchAtivo) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center font-sans">
          <div className="bg-gray-900 py-4 px-8 border-b-4 border-gray-800 flex justify-between items-center w-full absolute top-0">
            <img src={omegaLogo} alt="Logo" className="h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-300 uppercase tracking-widest">Poomsae</h1>
              <p className="text-gray-400 text-lg mt-1">{lutaAtual.nome_categoria}</p>
            </div>
            <div className="bg-gray-800 px-6 py-2 rounded-xl border border-gray-700">
              <span className="text-2xl font-black text-gray-400">Q{quadra}</span>
            </div>
          </div>
          <p className="text-5xl font-black text-gray-600 uppercase tracking-widest animate-pulse mt-20">Aguardando Apresentação...</p>
        </div>
      );
    }

    // Fullscreen: who is presenting right now
    return (
      <div className={`min-h-screen bg-gradient-to-b ${corBg} text-white flex flex-col font-sans overflow-hidden`}>
        {/* HEADER */}
        <div className="bg-black/60 py-4 px-8 border-b-4 border-gray-800 flex justify-between items-center">
          <img src={omegaLogo} alt="Logo" className="h-16" />
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-300 uppercase tracking-widest">Apresentação Poomsae</h1>
            <p className="text-gray-400 text-lg mt-1">{lutaAtual.nome_categoria}</p>
          </div>
          <div className="bg-gray-800 px-6 py-2 rounded-xl border border-gray-700">
            <span className="text-2xl font-black text-gray-400">Q{quadra}</span>
          </div>
        </div>

        {/* CONTEÚDO CENTRAL */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">

          {/* Athlete label badge */}
          <div className={`mb-6 px-10 py-3 rounded-full border-2 ${corBorda} bg-black/40`}>
            <span className={`text-2xl font-black tracking-widest uppercase ${corTexto}`}>{corLabel}</span>
          </div>

          {/* Athlete name */}
          <h2 className="text-8xl font-black text-white mb-4 text-center drop-shadow-lg">{nomeAtleta}</h2>
          {equipeAtleta && (
            <p className="text-3xl font-bold text-gray-400 bg-black/40 px-8 py-2 rounded-full mb-10">{equipeAtleta}</p>
          )}

          {/* Poomsae form box */}
          <div className={`border-2 ${corBorda} bg-black/50 rounded-3xl px-16 py-6 text-center shadow-2xl`}>
            <p className="text-lg text-gray-400 uppercase tracking-widest mb-1">Poomsae</p>
            <p className={`text-5xl font-black tracking-widest ${corTexto}`}>{poomsaeNome || 'Forma a Definir'}</p>
          </div>

          {/* Live indicator */}
          <div className="mt-10 flex items-center gap-3 bg-black/40 px-6 py-3 rounded-full border border-gray-700">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-gray-300 font-bold tracking-widest text-sm uppercase">Apresentando ao Vivo</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: KYORUGUI (LUTA)
  // ==========================================
  // Separa Nomes e Equipes
  const verNome = lutaAtual.atleta_vermelho?.split(' (')[0] || "Chong";
  const verEquipe = lutaAtual.atleta_vermelho?.includes('(') ? lutaAtual.atleta_vermelho.split('(')[1].replace(')', '') : '';
  const azuNome = lutaAtual.atleta_azul?.split(' (')[0] || "Hong";
  const azuEquipe = lutaAtual.atleta_azul?.includes('(') ? lutaAtual.atleta_azul.split('(')[1].replace(')', '') : '';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* HEADER SUPERIOR (Categoria e Quadra) */}
      <div className="bg-gray-900 py-3 px-8 flex justify-between items-center border-b-2 border-gray-800">
        <div className="flex items-center gap-4">
          <img src={omegaLogo} alt="Logo" className="h-10" />
          <span className="text-xl font-bold text-gray-400 uppercase tracking-wider">{lutaAtual.nome_categoria}</span>
        </div>
        <div className="bg-gray-800 px-4 py-1 rounded text-xl font-black text-gray-300">QUADRA {quadra}</div>
      </div>

      {/* ÁREA CENTRAL GIGANTE */}
      <div className="flex-1 flex">
        
        {/* LADO VERMELHO */}
        <div className="flex-1 bg-red-600 flex flex-col relative border-r-8 border-black">
          {/* Nome e Equipe */}
          <div className="pt-8 px-8 flex-1">
            <h2 className="text-6xl font-black text-white leading-none uppercase drop-shadow-lg break-words">{verNome}</h2>
            <p className="text-3xl font-bold text-red-200 mt-4 uppercase tracking-widest">{verEquipe}</p>
          </div>
          
          {/* Pontuação */}
          <div className="flex justify-center items-center py-8">
            <span className="text-[18rem] leading-none font-black tabular-nums drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {lutaAtual.placar_red || 0}
            </span>
          </div>

          {/* Gam-jeom (Bolinhas) */}
          <div className="bg-black bg-opacity-30 p-6 flex flex-col items-center">
            <span className="text-red-200 font-bold uppercase tracking-widest mb-3">Gam-jeom (Faltas)</span>
            <div className="flex gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-4 transition-all duration-300 ${i < (lutaAtual.faltas_red || 0) ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-110' : 'bg-transparent border-red-800'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL (Relógio e Round) */}
        <div className="w-80 bg-gray-900 flex flex-col items-center justify-start pt-12 z-10 shadow-2xl">
          <div className="bg-black border-2 border-gray-700 px-8 py-3 rounded-full mb-8">
            <span className="text-3xl font-black text-green-400 tracking-widest uppercase">Round {lutaAtual.round || 1}</span>
          </div>
          <div className="text-8xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {tempoLuta}
          </div>
        </div>

        {/* LADO AZUL */}
        <div className="flex-1 bg-blue-600 flex flex-col relative border-l-8 border-black">
          {/* Nome e Equipe */}
          <div className="pt-8 px-8 flex-1 text-right">
            <h2 className="text-6xl font-black text-white leading-none uppercase drop-shadow-lg break-words">{azuNome}</h2>
            <p className="text-3xl font-bold text-blue-200 mt-4 uppercase tracking-widest">{azuEquipe}</p>
          </div>
          
          {/* Pontuação */}
          <div className="flex justify-center items-center py-8">
            <span className="text-[18rem] leading-none font-black tabular-nums drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {lutaAtual.placar_blue || 0}
            </span>
          </div>

          {/* Gam-jeom (Bolinhas) */}
          <div className="bg-black bg-opacity-30 p-6 flex flex-col items-center">
            <span className="text-blue-200 font-bold uppercase tracking-widest mb-3">Gam-jeom (Faltas)</span>
            <div className="flex gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-4 transition-all duration-300 ${i < (lutaAtual.faltas_blue || 0) ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-110' : 'bg-transparent border-blue-800'}`} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ScoreboardTV;
