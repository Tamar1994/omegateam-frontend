import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, MonitorPlay } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { API_BASE_URL } from '../services/api'; // Garanta que o logo fique legal no fundo escuro

export function Live() {
  const { id } = useParams(); // Pega o ID do campeonato pela URL
  const [campeonato, setCampeonato] = useState(null);
  const [lutas, setLutas] = useState([]);
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [poomsaeData, setPoomsaeData] = useState({}); // keyed by luta._id → {vermelho, azul}
  const wsLive = useRef(null);

  // Relógio no topo da tela
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca os dados do campeonato e a fila de lutas
  const carregarDados = async () => {
    try {
      // Busca Nome do Campeonato
      if (!campeonato) {
        const campRes = await fetch(`${API_BASE_URL}/api/campeonatos/${id}`);
        setCampeonato(await campRes.json());
      }
      
      // Busca a fila atualizada
      const lutasRes = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/lutas`);
      setLutas(await lutasRes.json());
    } catch (error) {
      console.error("Erro ao buscar dados ao vivo.");
    }
  };

  // ==========================================
  // CONECTAR AO WEBSOCKET LIVE
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const connectLiveWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = `${protocol}//${baseUrl.split('//')[1]}/api/ws/live/${id}`;
      
      console.log('📺 [Live] Conectando ao WebSocket:', wsUrl);
      
      wsLive.current = new WebSocket(wsUrl);
      
      wsLive.current.onopen = () => {
        console.log('✅ [Live] WebSocket conectado');
      };
      
      wsLive.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [Live] Atualização recebida:', data);
          
          if (data.tipo === 'luta_atualizada') {
            console.log(`📺 [Live] Luta ${data.luta_id} atualizada: ${data.status}`);
            
            // Atualizar a luta na lista
            setLutas(prevLutas => 
              prevLutas.map(luta => 
                luta._id === data.luta_id 
                  ? {
                      ...luta,
                      status: data.status,
                      pontos_vermelho: data.placar.red_pontos,
                      pontos_azul: data.placar.blue_pontos,
                      faltas_vermelho: data.placar.red_faltas,
                      faltas_azul: data.placar.blue_faltas,
                      round: data.placar.round,
                      turno_poomsae: data.placar.turno_poomsae
                    }
                  : luta
              )
            );
          }
        } catch (e) {
          console.error('❌ [Live] Erro ao processar mensagem:', e);
        }
      };
      
      wsLive.current.onerror = (error) => {
        console.error('❌ [Live] Erro WebSocket:', error);
      };
      
      wsLive.current.onclose = () => {
        console.log('❌ [Live] WebSocket desconectado, tentando reconectar em 5s...');
        setTimeout(connectLiveWebSocket, 5000);
      };
    };
    
    connectLiveWebSocket();
    
    // Carregamento inicial
    carregarDados();
    
    // Poll a cada 30 segundos como fallback (menos frequente agora)
    const intervalo = setInterval(carregarDados, 30000); 
    
    return () => {
      clearInterval(intervalo);
      if (wsLive.current) {
        wsLive.current.close();
      }
    };
  }, [id, campeonato]);

  // ─── Poll poomsae match data for active Poomsae lutas ────────────
  useEffect(() => {
    const poomsaeLutas = lutas.filter(l => l.status === 'Em Andamento' && l.modalidade === 'Poomsae');
    if (poomsaeLutas.length === 0) return;

    const fetchPoomsae = async () => {
      const updates = {};
      for (const luta of poomsaeLutas) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/poomsae/matches?luta_id=${luta._id}`);
          if (!resp.ok) continue;
          const matches = await resp.json();
          const vermelho = matches.find(m => m.atleta_id && luta.atleta_vermelho?.includes(m.atleta_id));
          const azul = matches.find(m => m.atleta_id && luta.atleta_azul?.includes(m.atleta_id));
          // fallback: by order (first = vermelho, second = azul)
          const ordered = matches.sort((a, b) => new Date(a.criado_em || 0) - new Date(b.criado_em || 0));
          updates[luta._id] = {
            vermelho: vermelho || ordered[0] || null,
            azul: azul || ordered[1] || null,
          };
        } catch (_) {}
      }
      if (Object.keys(updates).length > 0) {
        setPoomsaeData(prev => ({ ...prev, ...updates }));
      }
    };

    fetchPoomsae();
    const interval = setInterval(fetchPoomsae, 5000);
    return () => clearInterval(interval);
  }, [lutas]);

  if (!campeonato) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold text-2xl">Carregando Painel Live...</div>;
  }

  // Filtra as lutas
  const lutasEmAndamento = lutas.filter(l => l.status === 'Em Andamento');
  const proximasLutas = lutas.filter(l => l.status === 'Aguardando Chamada').slice(0, 8);

  // Função auxiliar para buscar o nome da categoria no campeonato
  const getNomeCategoria = (idCategoria) => {
    const cat = campeonato.categorias?.find(c => c.id === idCategoria);
    return cat ? `${cat.idade_genero} | ${cat.graduacao} | ${cat.peso_ou_tipo}` : "Categoria Desconhecida";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans overflow-hidden flex flex-col">
      
      {/* HEADER DA TV */}
      <header className="bg-black py-4 px-8 border-b border-gray-800 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <img src={omegaLogo} alt="Omega Team" className="h-16 bg-white rounded p-1" />
          <div>
            <h1 className="text-2xl font-black text-gray-100 uppercase tracking-widest flex items-center gap-2">
              <MonitorPlay className="text-omega-red" /> Painel de Lutas Ao Vivo
            </h1>
            <p className="text-omega-red font-bold text-lg">{campeonato.nome}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black tabular-nums tracking-tighter">{horaAtual.toLocaleTimeString('pt-BR')}</p>
          <p className="text-gray-400 font-semibold">{horaAtual.toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* ÁREA DE LUTAS EM ANDAMENTO (CARDS SUPERIORES) */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
            <h2 className="text-2xl font-bold text-gray-300 uppercase tracking-wider">Acontecendo Agora</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lutasEmAndamento.length === 0 ? (
              <p className="text-gray-500 italic col-span-full">Nenhuma luta em andamento.</p>
            ) : (
              lutasEmAndamento.map((luta) => (
                <div key={luta._id} className="bg-gray-800 rounded-2xl border-4 border-omega-red shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-gray-700 py-2 px-4 flex justify-between items-center">
                    <span className="bg-omega-red text-white text-xs font-black px-3 py-1 rounded-full uppercase">Quadra {luta.quadra}</span>
                    <p className="text-sm font-bold text-gray-200 truncate ml-2">Luta {luta.ordem_luta} • {getNomeCategoria(luta.categoria_id).split('|')[0]}</p>
                  </div>
                  
                  {luta.modalidade === 'Kyorugui' ? (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-red-800 p-4 text-center border-b border-gray-900">
                        <h3 className="text-2xl font-black text-white">{luta.atleta_vermelho.split(' (')[0]}</h3>
                      </div>
                      <div className="bg-gray-900 py-1 text-center"><span className="text-xs font-bold text-gray-500 italic">VS</span></div>
                      <div className="bg-blue-800 p-4 text-center">
                        <h3 className="text-2xl font-black text-white">{luta.atleta_azul.split(' (')[0]}</h3>
                      </div>
                    </div>
                  ) : (
                    // ── POOMSAE card with WT scores ──
                    (() => {
                      const pd = poomsaeData[luta._id];
                      const mv = pd?.vermelho;
                      const ma = pd?.azul;

                      const AtletaScore = ({ match, atletaNome, cor }) => {
                        const res = match?.resultado;
                        const isAtivo = match?.status === 'Em Andamento';
                        const scores = match?._scores_count || 0;
                        return (
                          <div className={`p-3 ${cor === 'red' ? 'bg-red-900/30' : 'bg-blue-900/30'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-black ${cor === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                                {cor === 'red' ? '🔴' : '🔵'} {atletaNome}
                              </span>
                              {isAtivo && <span className="text-xs text-yellow-400 animate-pulse">♦ Ao Vivo</span>}
                            </div>
                            {res ? (
                              <div className="flex items-center gap-2">
                                <span className="text-white text-2xl font-black">{res.pontuacao_final?.toFixed(3)}</span>
                                <div className="text-xs text-gray-400 leading-tight">
                                  {res.detalhe_acuracia && <div>Ac: {res.detalhe_acuracia.media?.toFixed(2)}</div>}
                                  {res.detalhe_apresentacao && <div>Ap: {res.detalhe_apresentacao.media?.toFixed(2)}</div>}
                                  {res.detalhe_habilidade_tecnica && <div>HT: {res.detalhe_habilidade_tecnica.media?.toFixed(2)}</div>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">
                                {match ? (isAtivo ? 'Apresentando...' : 'Aguardando notas...') : 'A apresentar'}
                              </p>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div className="flex-1 flex flex-col divide-y divide-gray-800">
                          <div className="bg-gray-900 px-3 py-1">
                            <span className="text-gray-500 text-xs uppercase tracking-wider">Poomsae {mv?.tipo || ''}</span>
                            {mv?.forma_designada && <span className="text-yellow-400 text-xs ml-2">• {mv.forma_designada}</span>}
                          </div>
                          <AtletaScore match={mv} atletaNome={luta.atleta_vermelho?.split(' (')[0]} cor="red" />
                          <AtletaScore match={ma} atletaNome={luta.atleta_azul?.split(' (')[0]} cor="blue" />
                        </div>
                      );
                    })()
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ÁREA DE FILA POR QUADRA (COLUNAS INFERIORES) */}
        <section className="flex-1">
          <h2 className="text-xl font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
            Próximos a Lutar (Previsão de Horário)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {/* Agrupa as próximas lutas por quadra */}
            {[...new Set(proximasLutas.map(l => l.quadra))].sort().map(numQuadra => (
              <div key={numQuadra} className="bg-black rounded-2xl border border-gray-800 p-4 shadow-lg">
                <h3 className="text-lg font-black text-white mb-3 flex items-center justify-between">
                  <span>Quadra {numQuadra}</span>
                  <MonitorPlay size={18} className="text-gray-500" />
                </h3>
                
                <div className="flex flex-col gap-3">
                  {proximasLutas.filter(l => l.quadra === numQuadra).slice(0, 5).map(luta => (
                    <div key={luta._id} className="bg-gray-900 rounded-lg p-3 border-l-4 border-l-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400">Luta {luta.ordem_luta} • {luta.modalidade}</span>
                        <span className="text-xs font-bold text-omega-red bg-red-900 bg-opacity-30 px-2 py-0.5 rounded">
                          {luta.horario_previsto}
                        </span>
                      </div>
                      {luta.modalidade === 'Kyorugui' ? (
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span className="text-red-500 truncate w-1/2 text-right">{luta.atleta_vermelho.split(' (')[0]}</span>
                          <span className="text-gray-600 text-xs">x</span>
                          <span className="text-blue-500 truncate w-1/2">{luta.atleta_azul.split(' (')[0]}</span>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-200">
                          🎲 {luta.atleta_vermelho.split(' (')[0]} <span className="text-xs text-gray-500 mx-1">vs</span> {luta.atleta_azul.split(' (')[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default Live;