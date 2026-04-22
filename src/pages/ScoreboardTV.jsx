import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import omegaLogo from '../assets/omega-logo.png';

export function ScoreboardTV() {
  const { id, quadra } = useParams(); // Puxa o ID do camp e o número da quadra da URL
  
  const [lutaAtual, setLutaAtual] = useState(null);
  const [tempoLuta, setTempoLuta] = useState("00:00");
  
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
    // Determina quem está no tatame usando o novo campo turno_poomsae
    const turno = lutaAtual.turno_poomsae || 'chong_p1'; // Default para primeira apresentação
    const isChong = turno?.startsWith('chong');
    const isHong = turno?.startsWith('hong');
    const isPrimeiroP = turno?.includes('p1');
    
    const atletaAtivo = isChong ? lutaAtual.atleta_vermelho : isHong ? lutaAtual.atleta_azul : lutaAtual.atleta;
    const nomeAtleta = atletaAtivo?.split(' (')[0];
    const equipeAtleta = atletaAtivo?.includes('(') ? atletaAtivo.split('(')[1].replace(')', '') : '';
    
    // Determina qual Poomsae está sendo executado
    const poomsaeNome = isPrimeiroP ? lutaAtual.poomsae_1 : lutaAtual.poomsae_2;
    const rodadaInfo = isPrimeiroP ? '1ª Rodada' : '2ª Rodada';

    return (
      <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
        {/* HEADER */}
        <div className="bg-gray-900 py-4 px-8 border-b-4 border-gray-800 flex justify-between items-center">
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
          
          {/* Alerta do Poomsae a ser executado */}
          <div className="absolute top-10 bg-blue-900 bg-opacity-30 border-2 border-blue-500 px-12 py-4 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-bold text-blue-300 uppercase tracking-widest">{rodadaInfo}</span>
              <span className="text-3xl font-black text-blue-400 tracking-widest">{poomsaeNome || 'Aguardando Sorteio...'}</span>
            </div>
          </div>

          <h2 className="text-7xl font-black text-white mb-4 mt-20 text-center">{nomeAtleta}</h2>
          {equipeAtleta && <p className="text-3xl font-bold text-gray-400 bg-gray-900 px-8 py-2 rounded-full mb-12">{equipeAtleta}</p>}

          {/* ÁREA DAS NOTAS E ANIMAÇÃO */}
          <div className="w-full max-w-6xl h-64 flex items-center justify-center bg-gray-900 rounded-3xl border-4 border-gray-800 relative overflow-hidden">
            
            {faseAnimacao === 'espera' && (
              <p className="text-4xl font-bold text-gray-600 uppercase tracking-widest animate-pulse">Apresentação em Andamento...</p>
            )}

            {faseAnimacao === 'base' && (
              <div className="flex gap-16 animate-fade-in-up">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-2">Precisão</p>
                  <p className="text-8xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">4.0</p>
                </div>
                <div className="w-2 bg-gray-800 rounded-full"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-2">Apresentação</p>
                  <p className="text-8xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">6.0</p>
                </div>
              </div>
            )}

            {(faseAnimacao === 'juizes' || faseAnimacao === 'resultado') && (
              <div className="flex flex-col items-center w-full animate-fade-in-up">
                {/* Notas dos 5 Juízes */}
                <div className="flex gap-6 mb-8">
                  {notasSimuladas.map(nota => (
                    <div key={nota.id} className="relative">
                      <div className={`bg-gray-800 border-4 px-6 py-4 rounded-2xl ${nota.cortada ? 'border-red-900 opacity-50' : 'border-gray-600'}`}>
                        <p className={`text-5xl font-black ${nota.cortada ? 'text-gray-500' : 'text-white'}`}>{nota.val}</p>
                      </div>
                      {/* Risco Vermelho nas notas cortadas */}
                      {nota.cortada && <div className="absolute top-1/2 left-[-10%] w-[120%] h-2 bg-red-600 rotate-12 shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>}
                    </div>
                  ))}
                </div>
                
                {/* NOTA FINAL APARECE GIGANTE */}
                {faseAnimacao === 'resultado' && (
                  <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center animate-zoom-in">
                    <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-2">Nota Final</p>
                    <p className="text-[10rem] leading-none font-black text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.6)]">
                      {notaFinalPoomsae}
                    </p>
                  </div>
                )}
              </div>
            )}
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
