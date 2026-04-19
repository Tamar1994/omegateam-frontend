import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, AlertTriangle, Clock, ArrowRight, UserX, MonitorUp, Trophy, CheckCircle, Users, RotateCcw } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { API_BASE_URL } from '../services/api';

export function MesarioPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ==========================================
  // ESTADOS DO LOBBY E ACESSO
  // ==========================================
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [minhaQuadra, setMinhaQuadra] = useState(null);
  const [erroAcesso, setErroAcesso] = useState("");
  const [quadraAberta, setQuadraAberta] = useState(false);

  // ==========================================
  // ESTADOS DA LUTA E PLACAR
  // ==========================================
  const [lutaAtual, setLutaAtual] = useState(null);
  const [placar, setPlacar] = useState({ round: 1, redPontos: 0, bluePontos: 0, redFaltas: 0, blueFaltas: 0 });
  const [vencedor, setVencedor] = useState(null); 
  const [statusLuta, setStatusLuta] = useState('andamento'); 
  const [loadingLuta, setLoadingLuta] = useState(false);

  // ==========================================
  // ESTADOS DO RELÓGIO
  // ==========================================
  const [duracaoRound, setDuracaoRound] = useState(90);
  const [tempo, setTempo] = useState(90);
  const [tempoRodando, setTempoRodando] = useState(false);
  const [modoWO, setModoWO] = useState(false);

  // ==========================================
  // ESTADOS DO WEBSOCKET (JOYSTICK)
  // ==========================================
  const [ultimoPontoRecebido, setUltimoPontoRecebido] = useState(null);
  const [lateraisConectados, setLateraisConectados] = useState([]);
  const ws = useRef(null);

  // ==========================================
  // 1. CARREGAMENTO E POLLING DO LOBBY
  // ==========================================
  useEffect(() => {
    const userStr = localStorage.getItem('usuarioOmegaTeam');
    if (userStr) setUsuarioLogado(JSON.parse(userStr));
    else navigate('/login');
  }, [navigate]);

  const carregarMinhaQuadra = async () => {
    if (!usuarioLogado) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/minha-quadra/${usuarioLogado.email}`);
      if (res.ok) {
        setMinhaQuadra(await res.json());
      } else {
        const err = await res.json();
        setErroAcesso(err.detail);
      }
    } catch {
      console.error(t('erro_buscar_quadra'));
    }
  };

  useEffect(() => {
    if (!usuarioLogado || quadraAberta) return;
    carregarMinhaQuadra();
    const intervalo = setInterval(carregarMinhaQuadra, 3000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogado, quadraAberta, id]);

  const simularReady = async (slot, isReady) => {
    await fetch(`${API_BASE_URL}/api/campeonatos/${id}/quadras/${minhaQuadra.numero_quadra}/ready`, {
      method: 'PUT', headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lateral_slot: slot, is_ready: isReady })
    });
    carregarMinhaQuadra(); 
  };

  const todosProntos = () => {
    if (!minhaQuadra) return false;
    for (let i = 1; i <= 5; i++) {
      if (minhaQuadra[`lateral${i}_email`] && !minhaQuadra[`lateral${i}_ready`]) return false;
    }
    return true; 
  };

  // ==========================================
  // 2B. WEBSOCKET PARA PONTOS DO JOYSTICK (KYORUGUI)
  // ==========================================
  useEffect(() => {
    if (!quadraAberta || !lutaAtual || lutaAtual.modalidade === 'Poomsae') return;

    const conectarJoystickWebSocket = () => {
      // Validação
      if (!id || !minhaQuadra?.numero_quadra) {
        console.error('❌ Erro: id ou numero_quadra não disponível');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      // URL-encode seguro (luta_id pode ter caracteres especiais)
      const lutaIdCodificado = encodeURIComponent(id);
      const wsUrl = `${protocol}//${baseUrl.split('//')[1]}/api/ws/mesario/${lutaIdCodificado}/${minhaQuadra.numero_quadra}`;

      console.log('🔗 Conectando WebSocket Mesário:', wsUrl);
      console.log('📍 Dados:', { id, lutaIdCodificado, numero_quadra: minhaQuadra.numero_quadra });

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket Mesário conectado');
      };

      ws.current.onerror = (error) => {
        console.error('❌ Erro WebSocket Mesário:', error);
        console.error('URL tentada:', wsUrl);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Mensagem WebSocket recebida:', data);

        // ✅ NOVO: Atualizar status dos laterais conectados
        if (data.status === 'laterais_atualizacao') {
          console.log(`🔄 Laterais atualizados: ${data.total_laterais} conectados`, data.laterais_conectados);
          setLateraisConectados(data.laterais_conectados || []);
          return; // Não processar como ponto
        }

        // Se for ponto validado por Coincidence Window, atualizar automaticamente
        if (data.status === 'ponto_validado' && data.cor && data.pontos) {
          setUltimoPontoRecebido(data);
          
          // Atualizar placar automaticamente
          setPlacar(prev => {
            const novosPlacar = { ...prev };
            if (data.cor === 'vermelho') {
              novosPlacar.redPontos += parseInt(data.pontos);
            } else if (data.cor === 'azul') {
              novosPlacar.bluePontos += parseInt(data.pontos);
            }
            return novosPlacar;
          });

          // Fazer vibração se disponível
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }

          // Limpar indicador de ponto após 2 segundos
          setTimeout(() => setUltimoPontoRecebido(null), 2000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ Erro WebSocket Mesário:', error);
      };

      ws.current.onclose = () => {
        console.log('❌ WebSocket Mesário desconectado');
      };
    };

    conectarJoystickWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [quadraAberta, lutaAtual, id, minhaQuadra?.numero_quadra, t]);

  // ==========================================
  // 2C. INTEGRAÇÃO COM O BANCO DE DADOS
  // ==========================================
  const puxarProximaLuta = async () => {
    setLoadingLuta(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/quadras/${minhaQuadra.numero_quadra}/proxima-luta`);
      if (res.ok) {
        const dadosLuta = await res.json();
        setLutaAtual(dadosLuta);
        
        let tempoCalculado = 60;
        const cat = (dadosLuta.nome_categoria || "").toLowerCase();
        
        // Regra de tempo para Kyorugui e Poomsae
        if (dadosLuta.modalidade === 'Poomsae') tempoCalculado = 90;
        else if (cat.includes('festival') || cat.includes('mirim')) tempoCalculado = 45;
        else if (cat.includes('preta') || cat.includes('dan')) {
          if (cat.includes('adulto') || cat.includes('sub 21')) tempoCalculado = 120;
          else tempoCalculado = 90;
        }

        setDuracaoRound(tempoCalculado);
        setTempo(tempoCalculado);
        setPlacar({ round: 1, redPontos: 0, bluePontos: 0, redFaltas: 0, blueFaltas: 0 });
        setVencedor(null);
        setStatusLuta('andamento');
        setModoWO(false);
        setTempoRodando(false);

        // 🎬 NOTIFICAR OS LATERAIS SOBRE A LUTA
        try {
          console.log('📢 Notificando laterais sobre luta iniciada...');
          await fetch(`${API_BASE_URL}/api/lutas/${dadosLuta._id}/notificar-laterais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modalidade: dadosLuta.modalidade,
              atleta_vermelho: dadosLuta.atleta_vermelho,
              atleta_azul: dadosLuta.atleta_azul
            })
          });
          console.log('✅ Laterais notificados');
        } catch (err) {
          console.error('❌ Erro ao notificar laterais:', err);
        }
      } else {
        alert(t('nao_ha_mais_lutas_fila'));
        setQuadraAberta(false);
      }
    } catch {
      alert(t('erro_buscar_proxima_luta'));
    } finally {
      setLoadingLuta(false);
    }
  };

  const encerrarESalvarLuta = async () => {
    if (lutaAtual.modalidade === 'Kyorugui' && !vencedor) {
      return alert(t('forcar_declarar_vencedor'));
    }
    
    setLoadingLuta(true);
    try {
      await fetch(`${API_BASE_URL}/api/lutas/${lutaAtual._id}/finalizar`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vencedor: vencedor || 'Concluido', // Poomsae não declara red/blue
          placar_red: placar.redPontos,
          placar_blue: placar.bluePontos,
          faltas_red: placar.redFaltas,
          faltas_blue: placar.blueFaltas
        })
      });
      puxarProximaLuta(); 
    } catch {
      alert(t('erro_salvar_resultado_banco'));
      setLoadingLuta(false);
    }
  };

  // ==========================================
  // 3. MOTOR DO RELÓGIO
  // ==========================================
  useEffect(() => {
    let intervalo;
    if (tempoRodando && tempo > 0) {
      intervalo = setInterval(() => setTempo((t) => t - 1), 1000);
    } else if (tempo === 0 && tempoRodando) {
      setTempoRodando(false);
      
      if (modoWO) {
        alert("Tempo de W.O. Esgotado!");
        setModoWO(false);
        setTempo(duracaoRound);
      } 
      else if (lutaAtual?.modalidade === 'Poomsae') {
        setStatusLuta('encerrada'); // Poomsae encerra direto, sem rounds
      }
      else if (statusLuta === 'andamento') {
        if (placar.round < 2) {
          setStatusLuta('intervalo');
          setTempo(60); 
          setTempoRodando(true);
        } else {
          if (placar.redPontos === placar.bluePontos) {
            setStatusLuta('intervalo');
            setTempo(60);
            setTempoRodando(true);
          } else {
            declararVencedor(placar.redPontos > placar.bluePontos ? 'red' : 'blue');
          }
        }
      } 
      else if (statusLuta === 'intervalo') {
        if (placar.round < 2) {
          setPlacar(prev => ({ ...prev, round: prev.round + 1 }));
          setStatusLuta('andamento');
          setTempo(duracaoRound);
        } else {
          setPlacar(prev => ({ ...prev, round: 'GP', redPontos: 0, bluePontos: 0, redFaltas: 0, blueFaltas: 0 }));
          setStatusLuta('golden_point');
          setTempo(60);
        }
      }
      else if (statusLuta === 'golden_point') {
        alert(t('fim_golden_point'));
      }
    }
    return () => clearInterval(intervalo);
  }, [tempoRodando, tempo, modoWO, statusLuta, placar.round, duracaoRound, placar.redPontos, placar.bluePontos, lutaAtual, t]);

  useEffect(() => {
    if (statusLuta === 'golden_point') {
      if (placar.redPontos > 0) declararVencedor('red');
      else if (placar.bluePontos > 0) declararVencedor('blue');
    }
  }, [placar.redPontos, placar.bluePontos, statusLuta]);

  // ==========================================
  // 4. AÇÕES MANUAIS DO MESÁRIO
  // ==========================================
  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleTempo = () => { if (statusLuta !== 'encerrada') setTempoRodando(!tempoRodando); };
  
  const resetarRelogio = (s) => { 
    setTempoRodando(false); setModoWO(false); setTempo(s); 
    if (statusLuta === 'intervalo') setDuracaoRound(s); 
  };
  
  const iniciarWO = () => { 
    if (window.confirm(t('iniciar_wo'))) { setTempoRodando(false); setModoWO(true); setTempo(60); setTempoRodando(true); } 
  };

  const declararVencedor = (cor) => { setTempoRodando(false); setStatusLuta('encerrada'); setVencedor(cor); };
  
  const adicionarFalta = (cor) => {
    if (statusLuta === 'encerrada') return;
    setPlacar(prev => {
      const n = { ...prev };
      if (cor === 'red' && prev.redFaltas < 10) { n.redFaltas++; n.bluePontos++; } 
      else if (cor === 'blue' && prev.blueFaltas < 10) { n.blueFaltas++; n.redPontos++; }
      if (n.redFaltas === 10) declararVencedor('blue');
      if (n.blueFaltas === 10) declararVencedor('red');
      return n;
    });
  };

  const removerFalta = (cor) => {
    if (statusLuta === 'encerrada') return;
    setPlacar(prev => {
      const n = { ...prev };
      if (cor === 'red' && prev.redFaltas > 0 && prev.bluePontos > 0) { n.redFaltas--; n.bluePontos--; } 
      else if (cor === 'blue' && prev.blueFaltas > 0 && prev.redPontos > 0) { n.blueFaltas--; n.redPontos--; }
      return n;
    });
  };

  const ajustarPonto = (cor, valor) => {
    if (statusLuta !== 'encerrada') setPlacar(prev => ({ ...prev, [`${cor}Pontos`]: Math.max(0, prev[`${cor}Pontos`] + valor) }));
  };

  // ==========================================
  // RENDERIZAÇÃO DE TELAS DE ESPERA
  // ==========================================
  if (erroAcesso) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle size={80} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">{t('acesso_negado')}</h1>
        <p className="text-gray-400 text-lg mb-8">{erroAcesso}</p>
        <button onClick={() => navigate('/')} className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-bold">{t('voltar_inicio')}</button>
      </div>
    );
  }

  if (!minhaQuadra) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">{t('carregando_permissoes')}</div>;

  // LOBBY
  if (!quadraAberta) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
        <header className="bg-black py-4 px-6 border-b border-gray-800 flex justify-between items-center shadow-lg">
          <img src={omegaLogo} alt="Omega" className="h-10 bg-white p-1 rounded" />
          <h1 className="text-2xl font-black text-gray-200">Quadra {minhaQuadra.numero_quadra}</h1>
          <button onClick={() => navigate('/')} className="text-red-500 font-bold hover:text-red-400">Sair</button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="text-center mb-8">
              <Users size={60} className="mx-auto text-blue-500 mb-4" />
              <h2 className="text-3xl font-black mb-2">{t('check_in_equipe')}</h2>
              <p className="text-gray-400">{t('aguardando_juizes_sincronizar')}</p>
            </div>

            <div className="space-y-4 mb-8">
              {[1, 2, 3, 4, 5].map(i => {
                const emailLateral = minhaQuadra[`lateral${i}_email`];
                const isReady = minhaQuadra[`lateral${i}_ready`];
                if (!emailLateral) return null; 

                return (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${isReady ? 'bg-green-900/20 border-green-800' : 'bg-gray-900 border-gray-700'}`}>
                    <div className="flex items-center gap-4">
                      {isReady ? <CheckCircle className="text-green-500" size={28}/> : <Clock className="text-yellow-500 animate-pulse" size={28}/>}
                      <div>
                        <p className="font-bold text-gray-200">{t('juiz_lateral')} {i}</p>
                        <p className="text-sm text-gray-400">{emailLateral}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-black uppercase tracking-wider text-sm ${isReady ? 'text-green-500' : 'text-yellow-500'}`}>
                        {isReady ? t('pronto') : t('aguardando')}
                      </span>
                      <button onClick={() => simularReady(`lateral${i}`, !isReady)} className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1 rounded">
                        {isReady ? t('desfazer') : t('simular_ready')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => { setQuadraAberta(true); puxarProximaLuta(); }}
              disabled={!todosProntos()}
              className="w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-omega-red hover:bg-red-700 text-white"
            >
              {todosProntos() ? t('abrir_quadra_oficial') : t('equipe_incompleta')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!lutaAtual) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">{t('carregando_dados')}</div>;

  // ==========================================
  // RENDERIZAÇÃO: PAINEL DO MESÁRIO
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col select-none">
      
      <header className="bg-black py-3 px-6 border-b border-gray-800 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <img src={omegaLogo} alt="Omega" className="h-10 bg-white p-1 rounded" />
          <div>
            <h1 className="text-xl font-bold text-gray-200">{t('painel_mesario_quadra', { numero: minhaQuadra.numero_quadra })}</h1>
            <p className="text-gray-400 text-sm">{t('luta_numero_categoria', { ordem: lutaAtual.ordem_luta, categoria: lutaAtual.nome_categoria })}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {/* 🔄 Indicador de Laterais Conectados */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${lateraisConectados.length > 0 ? 'bg-green-900/30 text-green-400 border border-green-600' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
            <div className={`w-2 h-2 rounded-full ${lateraisConectados.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            {lateraisConectados.length > 0 ? `✓ ${lateraisConectados.length}/5 Laterais` : '○ Aguardando...'}
          </div>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-gray-700">
            <MonitorUp size={16} /> {t('placar_tv')}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {lutaAtual.modalidade === 'Poomsae' ? (
          // ==========================================
          // LAYOUT EXCLUSIVO PARA POOMSAE (CHAVES 1v1)
          // ==========================================
          <section className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LADO VERMELHO (CHONG) */}
            <div className={`flex flex-col bg-red-900 bg-opacity-20 border-4 rounded-2xl p-6 relative transition-all ${statusLuta === 'turno_chong_p1' || statusLuta === 'turno_chong_p2' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : vencedor === 'red' ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : 'border-red-900'}`}>
              <h2 className="text-3xl font-black text-center text-white truncate">{lutaAtual.atleta_vermelho?.split(' (')[0] || t('atleta_chong')}</h2>
              <p className="text-center text-red-400 font-bold tracking-widest uppercase mb-6">{t('atleta_chong')}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black bg-opacity-40 p-4 rounded-xl text-center border border-red-900/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('primeiro_poomsae')}</p>
                  <p className="text-sm font-bold text-red-300 mb-2">{lutaAtual.poomsae_1 || t('aguardando_sorteio')}</p>
                  <p className="text-4xl font-black text-white">{placar.chongP1 > 0 ? placar.chongP1.toFixed(2) : '--'}</p>
                </div>
                <div className="bg-black bg-opacity-40 p-4 rounded-xl text-center border border-red-900/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('segundo_poomsae')}</p>
                  <p className="text-sm font-bold text-red-300 mb-2">{lutaAtual.poomsae_2 || (lutaAtual.poomsae_1?.includes('Faixa') ? t('nao_aplicavel') : t('aguardando_sorteio'))}</p>
                  <p className="text-4xl font-black text-white">{placar.chongP2 > 0 ? placar.chongP2.toFixed(2) : '--'}</p>
                </div>
              </div>

              <div className="mt-auto bg-red-950 rounded-xl p-4 text-center flex justify-between items-center border border-red-800">
                <span className="text-red-200 font-bold uppercase tracking-wider">{t('media_final')}</span>
                <span className="text-5xl font-black text-white">
                  {placar.chongP1 > 0 ? (((placar.chongP1) + (placar.chongP2 || placar.chongP1)) / (placar.chongP2 > 0 ? 2 : 1)).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* LADO AZUL (HONG) */}
            <div className={`flex flex-col bg-blue-900 bg-opacity-20 border-4 rounded-2xl p-6 relative transition-all ${statusLuta === 'turno_hong_p1' || statusLuta === 'turno_hong_p2' ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : vencedor === 'blue' ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : 'border-blue-900'}`}>
              <h2 className="text-3xl font-black text-center text-white truncate">{lutaAtual.atleta_azul?.split(' (')[0] || t('atleta_hong')}</h2>
              <p className="text-center text-blue-400 font-bold tracking-widest uppercase mb-6">{t('atleta_hong')}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black bg-opacity-40 p-4 rounded-xl text-center border border-blue-900/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('primeiro_poomsae')}</p>
                  <p className="text-sm font-bold text-blue-300 mb-2">{lutaAtual.poomsae_1 || t('aguardando_sorteio')}</p>
                  <p className="text-4xl font-black text-white">{placar.hongP1 > 0 ? placar.hongP1.toFixed(2) : '--'}</p>
                </div>
                <div className="bg-black bg-opacity-40 p-4 rounded-xl text-center border border-blue-900/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('segundo_poomsae')}</p>
                  <p className="text-sm font-bold text-blue-300 mb-2">{lutaAtual.poomsae_2 || (lutaAtual.poomsae_1?.includes('Faixa') ? t('nao_aplicavel') : t('aguardando_sorteio'))}</p>
                  <p className="text-4xl font-black text-white">{placar.hongP2 > 0 ? placar.hongP2.toFixed(2) : '--'}</p>
                </div>
              </div>

              <div className="mt-auto bg-blue-950 rounded-xl p-4 text-center flex justify-between items-center border border-blue-800">
                <span className="text-blue-200 font-bold uppercase tracking-wider">{t('media_final')}</span>
                <span className="text-5xl font-black text-white">
                  {placar.hongP1 > 0 ? (((placar.hongP1) + (placar.hongP2 || placar.hongP1)) / (placar.hongP2 > 0 ? 2 : 1)).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* CONTROLES DO MESÁRIO (MÁQUINA DE ESTADOS DO POOMSAE) */}
            <div className="lg:col-span-12 bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 flex flex-col items-center shadow-xl mt-4">
              {statusLuta === 'encerrada' ? (
                <div className="text-center w-full max-w-md">
                  <Trophy size={60} className="text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-black text-white mb-6 uppercase">{t('vencedor_label')} {vencedor === 'red' ? t('atleta_chong') : t('atleta_hong')}</h3>
                  <button onClick={encerrarESalvarLuta} className="w-full bg-omega-red hover:bg-red-700 text-white px-8 py-5 rounded-xl font-black text-xl uppercase tracking-wider transition-colors shadow-lg flex justify-center gap-3">
                    {t('salvar_proxima_luta')} <ArrowRight size={24} />
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* Cronômetro de Apresentação */}
                  <div className="flex flex-col items-center">
                    <span className="text-gray-400 font-bold uppercase text-sm mb-2">{t('tempo_limite_90s')}</span>
                    <div className={`text-6xl font-black tabular-nums ${tempo <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {formatarTempo(tempo)}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={toggleTempo} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold">
                        {tempoRodando ? <Pause size={20}/> : <Play size={20}/>}
                      </button>
                      <button onClick={() => resetarRelogio(90)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold"><RotateCcw size={20}/></button>
                    </div>
                  </div>

                  {/* Controle de Turno Chong/Hong */}
                  <div className="flex-1 flex flex-col items-center border-l border-r border-gray-700 px-8">
                    <p className="text-yellow-400 font-black uppercase tracking-widest text-lg mb-4 text-center">
                      {statusLuta === 'andamento' && t('aguardando_inicio')}
                      {statusLuta === 'turno_chong_p1' && t('apresentacao_chong_1')}
                      {statusLuta === 'turno_hong_p1' && t('apresentacao_hong_1')}
                      {statusLuta === 'turno_chong_p2' && t('apresentacao_chong_2')}
                      {statusLuta === 'turno_hong_p2' && t('apresentacao_hong_2')}
                    </p>
                    
                    <button 
                      onClick={() => {
                        // Máquina de estados
                        if (statusLuta === 'andamento') setStatusLuta('turno_chong_p1');
                        else if (statusLuta === 'turno_chong_p1') setStatusLuta('turno_hong_p1');
                        else if (statusLuta === 'turno_hong_p1') setStatusLuta(lutaAtual.poomsae_2 ? 'turno_chong_p2' : 'encerrada');
                        else if (statusLuta === 'turno_chong_p2') setStatusLuta('turno_hong_p2');
                        else if (statusLuta === 'turno_hong_p2') setStatusLuta('encerrada');
                        resetarRelogio(90);
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-green-900/50 transition-all w-full max-w-sm"
                    >
                      {t('avancar_turno')}
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">{t('mesario_clica_avanca')}</p>
                  </div>

                  {/* Botões para Teste de Nota (Simulando os Joysticks) */}
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 font-bold uppercase text-sm mb-1 text-center">{t('simulador_juizes')}</span>
                    <button onClick={() => setPlacar(p => ({...p, chongP1: 7.23}))} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded font-bold text-sm border border-red-700/50">{t('nota')} {t('atleta_chong')} P1 (7.23)</button>
                    <button onClick={() => setPlacar(p => ({...p, hongP1: 7.10}))} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-4 py-2 rounded font-bold text-sm border border-blue-700/50">{t('nota')} {t('atleta_hong')} P1 (7.10)</button>
                    {lutaAtual.poomsae_2 && (
                      <>
                        <button onClick={() => setPlacar(p => ({...p, chongP2: 7.45}))} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded font-bold text-sm border border-red-700/50">{t('nota')} {t('atleta_chong')} P2 (7.45)</button>
                        <button onClick={() => setPlacar(p => ({...p, hongP2: 7.30}))} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-4 py-2 rounded font-bold text-sm border border-blue-700/50">{t('nota')} {t('atleta_hong')} P2 (7.30)</button>
                      </>
                    )}
                    <button onClick={() => {
                        const mediaChong = ((placar.chongP1 || 0) + (placar.chongP2 || placar.chongP1 || 0)) / (lutaAtual.poomsae_2 ? 2 : 1);
                        const mediaHong = ((placar.hongP1 || 0) + (placar.hongP2 || placar.hongP1 || 0)) / (lutaAtual.poomsae_2 ? 2 : 1);
                        declararVencedor(mediaChong > mediaHong ? 'red' : 'blue');
                    }} className="mt-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-black text-sm uppercase">{t('verificar_vencedor')}</button>
                  </div>
                </div>
              )}
            </div>
          </section>

        ) : (
          // ==========================================
          // LAYOUT PARA KYORUGUI (LUTA VERMELHO VS AZUL)
          // ==========================================
          <>
            {/* INDICADOR DE PONTO RECEBIDO */}
            {ultimoPontoRecebido && (
              <div className={`lg:col-span-12 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xl tracking-widest uppercase animate-pulse ${
                ultimoPontoRecebido.cor === 'vermelho'
                  ? 'bg-red-600/80 text-white'
                  : 'bg-blue-600/80 text-white'
              }`}>
                <CheckCircle size={32} />
                {t('ponto_validado')} • {ultimoPontoRecebido.cor} +{ultimoPontoRecebido.pontos}
              </div>
            )}

            {/* LADO VERMELHO */}
            <section className={`lg:col-span-4 flex flex-col bg-red-900 bg-opacity-20 border-2 rounded-2xl p-4 relative overflow-hidden transition-all ${vencedor === 'red' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'border-red-800'}`}>
              {vencedor === 'red' && <div className="absolute inset-0 bg-red-500 bg-opacity-20 animate-pulse pointer-events-none z-0"></div>}
              
              <h2 className="text-2xl font-black text-center mt-2 mb-1 truncate relative z-10">{lutaAtual.atleta_vermelho?.split(' (')[0]}</h2>
              <p className="text-center text-red-400 font-bold tracking-widest uppercase text-sm mb-4 relative z-10">{t('atleta_chong')}</p>
              
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="text-8xl font-black tabular-nums tracking-tighter text-white drop-shadow-lg mb-6">{placar.redPontos}</div>
                
                {statusLuta !== 'encerrada' && (
                  <>
                    <div className="flex gap-2 mb-8">
                      <button onClick={() => ajustarPonto('red', -1)} className="bg-gray-800 text-gray-300 w-12 h-12 rounded-full text-xl font-bold hover:bg-gray-700">-1</button>
                      <button onClick={() => ajustarPonto('red', 1)} className="bg-red-700 text-white w-12 h-12 rounded-full text-xl font-bold hover:bg-red-600">+1</button>
                    </div>
                    <div className="w-full bg-black bg-opacity-40 rounded-xl p-4 border border-red-900/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-300 font-bold uppercase text-sm">{t('gam_jeom')}</span>
                        <span className={`text-2xl font-black ${placar.redFaltas >= 8 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{placar.redFaltas}/10</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => removerFalta('red')} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-lg font-bold hover:bg-gray-700">- {t('falta')}</button>
                        <button onClick={() => adicionarFalta('red')} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold hover:bg-yellow-500 flex justify-center items-center gap-1">
                          <AlertTriangle size={18} /> + {t('falta')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {vencedor === 'red' && <div className="mt-8 flex flex-col items-center"><Trophy size={60} className="text-yellow-400 mb-2"/><span className="text-2xl font-black text-yellow-400 uppercase tracking-widest">{t('vencedor')}</span></div>}
              </div>
            </section>

            {/* RELÓGIO CENTRAL */}
            <section className="lg:col-span-4 flex flex-col items-center justify-start bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 shadow-2xl relative">
              
              <div className={`px-6 py-2 rounded-full border mb-6 transition-colors ${statusLuta === 'intervalo' ? 'bg-cyan-900 border-cyan-500' : statusLuta === 'golden_point' ? 'bg-yellow-900 border-yellow-500' : statusLuta === 'encerrada' ? 'bg-gray-900 border-gray-600' : 'bg-black border-gray-600'}`}>
                <span className={`font-black tracking-widest uppercase text-lg ${statusLuta === 'intervalo' ? 'text-cyan-300 animate-pulse' : statusLuta === 'golden_point' ? 'text-yellow-400 animate-pulse' : statusLuta === 'encerrada' ? 'text-gray-500' : 'text-green-400'}`}>
                  {statusLuta === 'intervalo' ? t('intervalo') : statusLuta === 'golden_point' ? t('golden_point') : statusLuta === 'encerrada' ? t('luta_encerrada') : `${t('round')} ${placar.round}`}
                </span>
              </div>

              <div className={`text-8xl font-black tabular-nums tracking-tighter mb-8 transition-colors ${modoWO ? 'text-yellow-500' : statusLuta === 'intervalo' ? 'text-cyan-400' : statusLuta === 'golden_point' ? 'text-yellow-400' : statusLuta === 'encerrada' ? 'text-gray-600' : tempo <= 10 && tempo > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatarTempo(tempo)}
              </div>

              {statusLuta !== 'encerrada' ? (
                <>
                  <div className="flex w-full gap-4 mb-8">
                    <button onClick={toggleTempo} className={`flex-1 flex flex-col items-center justify-center py-6 rounded-2xl font-black text-xl shadow-xl transition-all ${tempoRodando ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'}`}>
                      {tempoRodando ? <><Pause size={40} className="mb-2"/> {t('pausar')}</> : <><Play size={40} className="mb-2"/> {t('iniciar')}</>}
                    </button>
                  </div>

                  <div className="w-full grid grid-cols-3 gap-2 mb-4">
                    <button onClick={() => resetarRelogio(60)} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-bold text-gray-300">1:00</button>
                    <button onClick={() => resetarRelogio(90)} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-bold text-gray-300">1:30</button>
                    <button onClick={() => resetarRelogio(120)} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-bold text-gray-300">2:00</button>
                  </div>

                  <button onClick={iniciarWO} className="w-full flex items-center justify-center gap-2 bg-gray-900 border border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/30 py-3 rounded-lg font-bold transition-colors">
                    <Clock size={18} /> {t('cronometro_wo')}
                  </button>
                </>
              ) : (
                 <div className="mt-8 text-center flex flex-col items-center gap-4 w-full">
                    <button onClick={encerrarESalvarLuta} disabled={loadingLuta} className="w-full bg-omega-red hover:bg-red-700 text-white px-8 py-5 rounded-xl font-black text-xl uppercase tracking-wider transition-colors shadow-lg shadow-red-900/50 flex items-center justify-center gap-3">
                      {loadingLuta ? t('salvando') : t('salvar_proxima_luta')} <ArrowRight size={24} />
                    </button>
                    <button onClick={() => setQuadraAberta(false)} className="w-full bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold uppercase transition-colors">
                      {t('pausar_quadra')}
                    </button>
                 </div>
              )}
            </section>

            {/* LADO AZUL */}
            <section className={`lg:col-span-4 flex flex-col bg-blue-900 bg-opacity-20 border-2 rounded-2xl p-4 relative overflow-hidden transition-all ${vencedor === 'blue' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 'border-blue-800'}`}>
              {vencedor === 'blue' && <div className="absolute inset-0 bg-blue-500 bg-opacity-20 animate-pulse pointer-events-none z-0"></div>}
              
              <h2 className="text-2xl font-black text-center mt-2 mb-1 truncate relative z-10">{lutaAtual.atleta_azul?.split(' (')[0]}</h2>
              <p className="text-center text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 relative z-10">{t('atleta_hong')}</p>
              
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="text-8xl font-black tabular-nums tracking-tighter text-white drop-shadow-lg mb-6">{placar.bluePontos}</div>
                
                {statusLuta !== 'encerrada' && (
                  <>
                    <div className="flex gap-2 mb-8">
                      <button onClick={() => ajustarPonto('blue', -1)} className="bg-gray-800 text-gray-300 w-12 h-12 rounded-full text-xl font-bold hover:bg-gray-700">-1</button>
                      <button onClick={() => ajustarPonto('blue', 1)} className="bg-blue-700 text-white w-12 h-12 rounded-full text-xl font-bold hover:bg-blue-600">+1</button>
                    </div>
                    <div className="w-full bg-black bg-opacity-40 rounded-xl p-4 border border-blue-900/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-300 font-bold uppercase text-sm">{t('gam_jeom')}</span>
                        <span className={`text-2xl font-black ${placar.blueFaltas >= 8 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{placar.blueFaltas}/10</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => removerFalta('blue')} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-lg font-bold hover:bg-gray-700">- {t('falta')}</button>
                        <button onClick={() => adicionarFalta('blue')} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold hover:bg-yellow-500 flex justify-center items-center gap-1">
                          <AlertTriangle size={18} /> + {t('falta')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {vencedor === 'blue' && <div className="mt-8 flex flex-col items-center"><Trophy size={60} className="text-yellow-400 mb-2"/><span className="text-2xl font-black text-yellow-400 uppercase tracking-widest">{t('vencedor')}</span></div>}
              </div>
            </section>
          </>
        )}
      </main>

      {/* RODAPÉ EXTRA PARA FORÇAR ENCERRAMENTO NO KYORUGUI */}
      {statusLuta !== 'encerrada' && lutaAtual.modalidade === 'Kyorugui' && (
        <footer className="bg-black p-4 border-t border-gray-800 flex justify-between items-center">
          <div className="flex gap-4">
            <button onClick={() => declararVencedor(placar.redPontos > placar.bluePontos ? 'red' : placar.redPontos < placar.bluePontos ? 'blue' : null)} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2">
              <Square size={18} className="text-red-500" /> {t('forcar_encerramento')}
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2">
              <UserX size={18} className="text-yellow-500" /> {t('declarar_wo')}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default MesarioPanel;