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
  const [alertaLateralCaiu, setAlertaLateralCaiu] = useState(null); // Armazena email do lateral que caiu
  const [tokenScoreboard, setTokenScoreboard] = useState(null); // Token para acesso ao Scoreboard
  const [poomsaeStatus, setPoomsaeStatus] = useState(null); // Status atual do Poomsae (notas intermediárias)
  const ws = useRef(null);

  // ==========================================
  // ESTADOS DO POOMSAE WT (ARTIGO 13)
  // ==========================================
  // poomsaeFlow: aguardando | apresentando_vermelho | coletando_vermelho |
  //              apresentando_azul | coletando_azul | resultado | encerrada
  const [poomsaeFlow, setPoomsaeFlow] = useState('aguardando');
  const [poomsaeMatchVermelho, setPoomsaeMatchVermelho] = useState(null); // {id, resultado}
  const [poomsaeMatchAzul, setPoomsaeMatchAzul] = useState(null);
  const [poomsaeScoresVermelho, setPoomsaeScoresVermelho] = useState({ recebidos: [], pendentes: [] });
  const [poomsaeScoresAzul, setPoomsaeScoresAzul] = useState({ recebidos: [], pendentes: [] });
  const [deducoesVermelho, setDeducoesVermelho] = useState({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
  const [deducoesAzul, setDeducoesAzul] = useState({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
  const [tipoPoomsae, setTipoPoomsae] = useState('Recognized'); // 'Recognized' | 'Freestyle'

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
        const quadraData = await res.json();
        setMinhaQuadra(quadraData);
        // 📺 SALVAR TOKEN DA QUADRA
        if (quadraData.token_scoreboard) {
          setTokenScoreboard(quadraData.token_scoreboard);
          console.log('📺 Token Scoreboard da Quadra:', quadraData.token_scoreboard);
        }
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

  const todosProntos = () => {
    if (!minhaQuadra) return false;
    
    // Verificar se há pelo menos 1 lateral definido
    let temLateraisDefinidos = false;
    
    for (let i = 1; i <= 5; i++) {
      const emailLateral = minhaQuadra[`lateral${i}_email`];
      const isReady = minhaQuadra[`lateral${i}_ready`];
      
      if (emailLateral) {
        temLateraisDefinidos = true;
        // Se tem lateral MAS não está pronto, retorna false
        if (!isReady) return false;
      }
    }
    
    // ✅ Todos os laterals que existem estão prontos E há pelo menos 1 lateral
    return temLateraisDefinidos;
  };

  // ==========================================
  // CARREGAR NOTAS INTERMEDIÁRIAS DO POOMSAE
  // ==========================================
  const carregarStatusPoomsae = async () => {
    if (!lutaAtual || lutaAtual.modalidade !== 'Poomsae') return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/lutas/${lutaAtual._id}/joystick/status-poomsae`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Status Poomsae carregado:', status);
        
        setPoomsaeStatus(status);
        
        // Atualizar placar com as médias recebidas
        if (status.status === 'em_progresso') {
          const novasNotas = { ...placar };
          
          // Adicionar accuracy médias se existirem
          if (status.accuracy.vermelho.media !== null) {
            if (statusLuta === 'turno_chong_p1') {
              novasNotas.chongP1 = status.accuracy.vermelho.media;
            } else if (statusLuta === 'turno_chong_p2') {
              novasNotas.chongP2 = status.accuracy.vermelho.media;
            }
          }
          
          if (status.accuracy.azul.media !== null) {
            if (statusLuta === 'turno_hong_p1') {
              novasNotas.hongP1 = status.accuracy.azul.media;
            } else if (statusLuta === 'turno_hong_p2') {
              novasNotas.hongP2 = status.accuracy.azul.media;
            }
          }
          
          setPlacar(novasNotas);
        }
      } else {
        console.error('❌ Erro ao carregar status Poomsae');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status Poomsae:', error);
    }
  };

  // ==========================================
  // SALVAR TURNO POOMSAE NO BANCO
  // ==========================================
  const salvarTurnoPoomsae = async (turno) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lutas/${lutaAtual._id}/atualizar-turno-poomsae`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_poomsae: turno })
      });
      
      if (response.ok) {
        console.log(`✅ Turno Poomsae atualizado para: ${turno}`);
      } else {
        console.error('❌ Erro ao salvar turno Poomsae:', await response.text());
      }
    } catch (error) {
      console.error('❌ Erro ao enviar turno Poomsae:', error);
    }
  };

  // ==========================================
  // VERIFICAR POOMSAE INCOMPLETO
  // ==========================================
  const verificarPoomsaeIncompleto = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lutas/${lutaAtual._id}/joystick/status-poomsae`);
      
      if (response.ok) {
        const status = await response.json();
        
        // Se há sessão incompleta
        if (status.status === 'incompleto') {
          console.warn('⚠️ POOMSAE INCOMPLETO DETECTADO:', status);
          
          // Mostrar alerta ao Mesário
          const mensagem = `
⚠️ SESSÃO DE POOMSAE INCOMPLETA ENCONTRADA!

Accuracy Chong: ${status.accuracy.vermelho}
Accuracy Hong: ${status.accuracy.azul}

Apresentação Chong: ${status.apresentacao.vermelho}
Apresentação Hong: ${status.apresentacao.azul}

Tempo restante: ${status.tempo_restante_segundos}s

Deseja RECUPERAR esta sessão?
          `;
          
          if (window.confirm(mensagem)) {
            console.log('✅ Recuperando sessão Poomsae incompleta...');
            // WebSocket já está conectado, juízes podem reenviar notas
          }
        } else if (status.status === 'nao_existe') {
          console.log('✅ Nenhuma sessão Poomsae em progresso');
        }
      } else {
        console.error('❌ Erro ao verificar status Poomsae:', await response.text());
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Poomsae incompleto:', error);
    }
  };

  // ==========================================
  // 2B. WEBSOCKET PARA PONTOS DO JOYSTICK
  // ==========================================
  useEffect(() => {
    if (!quadraAberta || !lutaAtual) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const lutaIdCodificado = encodeURIComponent(id);

    if (lutaAtual.modalidade === 'Poomsae') {
      // ==========================================
      // POOMSAE: WebSocket para receber notas dos juízes
      // ==========================================
      const connectPoomsaeSocket = () => {
        if (!id) {
          console.error('❌ [Poomsae] id não disponível');
          return;
        }

        const wsUrl = `${protocol}//${baseUrl.split('//')[1]}/api/ws/mesario/${lutaIdCodificado}`;
        console.log('🔗 [Poomsae] Conectando WebSocket:', wsUrl);
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('✅ [Poomsae] WebSocket conectado');
          
          // ====== VERIFICAR SE HÁ POOMSAE INCOMPLETO ======
          verificarPoomsaeIncompleto();
        };

        ws.current.onerror = (error) => {
          console.error('❌ [Poomsae] Erro WebSocket:', error);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 [Poomsae] Mensagem recebida:', data.tipo, data);

            // ✅ RESULTADO FINAL com notas dos juízes
            if (data.tipo === 'poomsae_resultado_final') {
              console.log('✅ [Poomsae] RESULTADO FINAL recebido!', data.resultado_final);
              
              const notas = data.resultado_final?.notas || {};
              setPlacar({
                round: 1,
                chongP1: notas.vermelho?.p1 || notas.vermelho || 0,
                hongP1: notas.azul?.p1 || notas.azul || 0,
                chongP2: notas.vermelho?.p2 || 0,
                hongP2: notas.azul?.p2 || 0
              });
              
              setStatusLuta('encerrada');
              const vencedorDeterminado = data.resultado_final?.vencedor === 'vermelho' ? 'red' : 'blue';
              setVencedor(vencedorDeterminado);
              
              // Vibração para alertar do resultado
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
            }

            // ✅ COMPUTANDO: Aguardando outros juízes
            else if (data.tipo === 'poomsae_computando') {
              console.log('⏳ [Poomsae] Aguardando outros juízes:', data);
            }

            // ✅ STATUS DE LATERAIS/JUÍZES CONECTADOS
            else if (data.tipo === 'laterais_atualizacao' || data.status === 'laterais_atualizacao') {
              console.log('🔄 [Poomsae] Juízes conectados:', data.laterais_conectados);
              setLateraisConectados(data.laterais_conectados || []);
            }
          } catch (e) {
            console.error('❌ [Poomsae] Erro ao processar mensagem:', e);
          }
        };

        ws.current.onclose = () => {
          console.log('❌ [Poomsae] WebSocket desconectado');
        };
      };

      connectPoomsaeSocket();
    } else {
      // ==========================================
      // KYORUGUI: WebSocket para pontos
      // ==========================================
      const conectarJoystickWebSocket = () => {
        if (!id || !minhaQuadra?.numero_quadra) {
          console.error('❌ Erro: id ou numero_quadra não disponível');
          return;
        }

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

          if (data.status === 'laterais_atualizacao') {
            console.log(`🔄 Laterais atualizados: ${data.total_laterais} conectados`, data.laterais_conectados);
            
            if (lateraisConectados.length > (data.laterais_conectados || []).length) {
              for (const email of lateraisConectados) {
                if (!data.laterais_conectados?.includes(email)) {
                  console.error(`❌ LATERAL DESCONECTOU: ${email}`);
                  setAlertaLateralCaiu(email);
                  
                  if (tempoRodando) {
                    console.error('⏸️ PAUSANDO CRONÔMETRO - Lateral caiu durante a luta!');
                    setTempoRodando(false);
                  }
                  
                  setTimeout(() => setAlertaLateralCaiu(null), 10000);
                  break;
                }
              }
            }
            
            if (lateraisConectados.length < (data.laterais_conectados || []).length) {
              console.log('✅ LATERAL RECONECTOU!');
              setAlertaLateralCaiu(null);
            }
            
            setLateraisConectados(data.laterais_conectados || []);
            return;
          }

          if (data.status === 'ponto_validado' && data.cor && data.pontos) {
            setUltimoPontoRecebido(data);
            
            setPlacar(prev => {
              const novosPlacar = { ...prev };
              if (data.cor === 'vermelho') {
                novosPlacar.redPontos += parseInt(data.pontos);
              } else if (data.cor === 'azul') {
                novosPlacar.bluePontos += parseInt(data.pontos);
              }
              return novosPlacar;
            });

            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

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
    }

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
      
      // 📡 NOTIFICAR LATERAIS QUE LUTA ACABOU
      try {
        await fetch(`${API_BASE_URL}/api/lutas/${lutaAtual._id}/notificar-fim-luta`, {
          method: 'POST'
        });
        console.log('✅ Laterais notificados que luta finalizou');
      } catch (err) {
        console.error('❌ Erro ao notificar fim de luta:', err);
      }
      
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

  const toggleTempo = () => {
    if (statusLuta === 'encerrada') return;
    
    const novoEstado = !tempoRodando;
    setTempoRodando(novoEstado);
    
    // Quando PAUSAR o tempo no Poomsae, carregar notas dos árbitros
    if (!novoEstado && lutaAtual?.modalidade === 'Poomsae') {
      console.log('⏸️ Pausando Poomsae - Carregando notas dos árbitros...');
      carregarStatusPoomsae();
    }
  };
  
  const resetarRelogio = (s) => { 
    setTempoRodando(false); setModoWO(false); setTempo(s); 
    if (statusLuta === 'intervalo') setDuracaoRound(s); 
  };

  // ==========================================
  // POOMSAE WT: FUNÇÕES DE FLUXO
  // ==========================================

  const getTempoLimitePoomsae = () => tipoPoomsae === 'Freestyle' ? 100 : 90;

  const extrairAtletaId = (atletaStr) =>
    atletaStr?.match(/\(([^)]+)\)/)?.[1] || atletaStr || 'desconhecido';

  const criarEIniciarMatchPoomsae = async (atletaCor) => {
    const atletaStr = atletaCor === 'vermelho' ? lutaAtual.atleta_vermelho : lutaAtual.atleta_azul;
    const atletaId = extrairAtletaId(atletaStr);
    const forma = lutaAtual.poomsae_1 || 'Poomsae';

    let matchId = null;
    // Check for existing active match first
    try {
      const existing = await fetch(`${API_BASE_URL}/api/poomsae/matches?luta_id=${lutaAtual._id}&status=Em%20Andamento`);
      if (existing.ok) {
        const list = await existing.json();
        const mine = list.find(m => m.atleta_id === atletaId);
        if (mine) { matchId = mine.id; }
      }
    } catch (_) {}

    if (!matchId) {
      const resp = await fetch(`${API_BASE_URL}/api/poomsae/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          luta_id: lutaAtual._id,
          campeonato_id: id,
          atleta_id: atletaId,
          tipo: tipoPoomsae,
          forma_designada: forma,
          divisao: lutaAtual.nome_categoria || 'Geral',
          rodada: 1,
          numero_juizes: lateraisConectados.length > 0 ? Math.min(lateraisConectados.length, 7) : 5,
        })
      });
      if (!resp.ok) throw new Error('Erro ao criar match poomsae');
      const match = await resp.json();
      matchId = match.id;

      await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}/iniciar`, { method: 'POST' });
    }

    // Broadcast to laterais via WS
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        tipo: 'poomsae_match_iniciado',
        match_id: matchId,
        tipo_poomsae: tipoPoomsae,
        atleta: atletaCor,
        forma: forma,
      }));
    }

    return matchId;
  };

  const iniciarApresentacaoVermelho = async () => {
    try {
      const matchId = await criarEIniciarMatchPoomsae('vermelho');
      setPoomsaeMatchVermelho({ id: matchId, resultado: null });
      setDeducoesVermelho({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
      setPoomsaeFlow('apresentando_vermelho');
      resetarRelogio(getTempoLimitePoomsae());
    } catch (err) {
      alert('Erro ao iniciar apresentação: ' + err.message);
    }
  };

  const encerrarApresentacaoVermelho = () => {
    setTempoRodando(false);
    // Flag fora_do_tempo for Freestyle if time didn't reach 90s
    if (tipoPoomsae === 'Freestyle' && tempo > 10) {
      applyDeducaoPoomsae('vermelho', 'tempo');
    }
    setPoomsaeFlow('coletando_vermelho');
  };

  const iniciarApresentacaoAzul = async () => {
    try {
      const matchId = await criarEIniciarMatchPoomsae('azul');
      setPoomsaeMatchAzul({ id: matchId, resultado: null });
      setDeducoesAzul({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
      setPoomsaeFlow('apresentando_azul');
      resetarRelogio(getTempoLimitePoomsae());
    } catch (err) {
      alert('Erro ao iniciar apresentação: ' + err.message);
    }
  };

  const encerrarApresentacaoAzul = () => {
    setTempoRodando(false);
    if (tipoPoomsae === 'Freestyle' && tempo > 10) {
      applyDeducaoPoomsae('azul', 'tempo');
    }
    setPoomsaeFlow('coletando_azul');
  };

  const applyDeducaoPoomsae = async (cor, tipo) => {
    const matchId = cor === 'vermelho' ? poomsaeMatchVermelho?.id : poomsaeMatchAzul?.id;
    const deducoes = cor === 'vermelho' ? deducoesVermelho : deducoesAzul;
    const setter = cor === 'vermelho' ? setDeducoesVermelho : setDeducoesAzul;

    const novaDeducao = { ...deducoes };
    if (tipo === 'zona') novaDeducao.saiu_zona = true;
    if (tipo === 'tempo') novaDeducao.fora_do_tempo = true;
    if (tipo === 'kyeong_go') {
      novaDeducao.num_kyeong_go = Math.min(2, (deducoes.num_kyeong_go || 0) + 1);
      if (novaDeducao.num_kyeong_go >= 2) novaDeducao.desqualificado = true;
    }
    setter(novaDeducao);

    if (matchId) {
      try {
        await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}/deducoes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novaDeducao),
        });
      } catch (_) {}
    }
  };

  const confirmarResultadoPoomsae = () => {
    const resV = poomsaeMatchVermelho?.resultado;
    const resA = poomsaeMatchAzul?.resultado;
    if (!resV || !resA) return;

    const finalV = resV.pontuacao_final ?? 0;
    const finalA = resA.pontuacao_final ?? 0;
    declararVencedor(finalV >= finalA ? 'red' : 'blue');
    setPoomsaeFlow('encerrada');
  };

  // Reset poomsae flow when a new luta loads
  useEffect(() => {
    if (lutaAtual?.modalidade === 'Poomsae') {
      setPoomsaeFlow('aguardando');
      setPoomsaeMatchVermelho(null);
      setPoomsaeMatchAzul(null);
      setPoomsaeScoresVermelho({ recebidos: [], pendentes: [] });
      setPoomsaeScoresAzul({ recebidos: [], pendentes: [] });
      setDeducoesVermelho({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
      setDeducoesAzul({ saiu_zona: false, fora_do_tempo: false, num_kyeong_go: 0 });
      setTipoPoomsae(lutaAtual.tipo_poomsae || 'Recognized');
    }
  }, [lutaAtual?._id]);

  // Poll scores while collecting
  useEffect(() => {
    const flow = poomsaeFlow;
    if (flow !== 'coletando_vermelho' && flow !== 'coletando_azul') return;

    const matchId = flow === 'coletando_vermelho' ? poomsaeMatchVermelho?.id : poomsaeMatchAzul?.id;
    if (!matchId) return;

    const poll = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}/scores`);
        if (!resp.ok) return;
        const data = await resp.json();

        if (flow === 'coletando_vermelho') {
          setPoomsaeScoresVermelho(data);
        } else {
          setPoomsaeScoresAzul(data);
        }

        // All judges submitted — fetch result
        if (Array.isArray(data.pendentes) && data.pendentes.length === 0 && Array.isArray(data.recebidos) && data.recebidos.length > 0) {
          const mResp = await fetch(`${API_BASE_URL}/api/poomsae/matches/${matchId}`);
          if (mResp.ok) {
            const mData = await mResp.json();
            if (mData.resultado) {
              if (flow === 'coletando_vermelho') {
                setPoomsaeMatchVermelho(prev => ({ ...prev, resultado: mData.resultado }));
                setPoomsaeFlow('apresentando_azul');
                resetarRelogio(getTempoLimitePoomsae());
              } else {
                setPoomsaeMatchAzul(prev => ({ ...prev, resultado: mData.resultado }));
                setPoomsaeFlow('resultado');
              }
            }
          }
        }
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poomsaeFlow, poomsaeMatchVermelho?.id, poomsaeMatchAzul?.id]);
  
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
            
            {/* 📺 CÓDIGO SCOREBOARD - ANTES DE ABRIR QUADRA */}
            {tokenScoreboard && (
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-2 border-purple-500 rounded-xl p-4 flex items-center justify-between mb-8">
                <div>
                  <p className="text-purple-300 font-bold text-sm">📺 CÓDIGO SCOREBOARD PARA TV</p>
                  <p className="text-gray-400 text-xs mt-1">Compartilhe este código ANTES de abrir a quadra</p>
                </div>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(tokenScoreboard);
                    alert('Código copiado!');
                  }}
                  className="bg-purple-700 hover:bg-purple-600 cursor-pointer text-white px-6 py-3 rounded-lg font-black text-2xl tracking-widest transition-colors"
                >
                  {tokenScoreboard}
                </div>
              </div>
            )}

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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔴 ALERTA: LATERAL DESCONECTOU */}
            {alertaLateralCaiu && (
              <div className="bg-red-900/40 border-2 border-red-500 rounded-xl p-4 text-center">
                <p className="text-red-300 font-bold">
                  ⚠️ Lateral desconectou! A luta foi pausada.
                </p>
                <p className="text-xs text-red-400">{alertaLateralCaiu}</p>
              </div>
            )}

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
          <button 
            onClick={() => window.open(`/scoreboard`, '_blank')}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-gray-700"
          >
            <MonitorUp size={16} /> {t('placar_tv')}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {lutaAtual.modalidade === 'Poomsae' ? (
          // ==========================================
          // LAYOUT EXCLUSIVO PARA POOMSAE (CHAVES 1v1)
          // ==========================================
          <section className="lg:col-span-12 space-y-4">

            {/* ── Tipo Poomsae + atletas ── */}
            <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-5 py-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Modalidade</p>
                <p className="font-black text-white text-lg">{tipoPoomsae} Poomsae</p>
                {lutaAtual.poomsae_1 && <p className="text-yellow-400 text-sm font-bold">Forma: {lutaAtual.poomsae_1}</p>}
              </div>
              <div className="flex gap-2">
                {['Recognized', 'Freestyle'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setTipoPoomsae(tipo)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${tipoPoomsae === tipo ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LATERAL ALERTA ── */}
            {alertaLateralCaiu && (
              <div className="bg-red-900/60 border-2 border-red-500 rounded-xl p-3 text-center animate-pulse">
                <p className="text-red-300 font-black">⚠️ LATERAL DESCONECTOU — A luta foi pausada.</p>
                <p className="text-xs text-red-400 mt-1">{alertaLateralCaiu}</p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────
                FLOW: AGUARDANDO — Escolher quem vai primeiro
            ───────────────────────────────────────────────────── */}
            {poomsaeFlow === 'aguardando' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-900/20 border-2 border-red-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <h2 className="text-2xl font-black text-white truncate">{lutaAtual.atleta_vermelho?.split(' (')[0]}</h2>
                  <p className="text-red-400 font-bold uppercase tracking-widest text-sm">Chong — 1º a apresentar</p>
                  <button
                    onClick={iniciarApresentacaoVermelho}
                    className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-colors shadow-lg"
                  >
                    ▶ Iniciar Apresentação
                  </button>
                </div>
                <div className="bg-blue-900/20 border-2 border-blue-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <h2 className="text-2xl font-black text-white truncate">{lutaAtual.atleta_azul?.split(' (')[0]}</h2>
                  <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">Hong — 2º a apresentar</p>
                  <div className="w-full bg-gray-700 text-gray-500 py-4 rounded-xl font-black text-lg uppercase text-center">
                    Aguardando Chong...
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────
                FLOW: APRESENTANDO / COLETANDO
            ───────────────────────────────────────────────────── */}
            {['apresentando_vermelho', 'coletando_vermelho', 'apresentando_azul', 'coletando_azul'].includes(poomsaeFlow) && (() => {
              const isVerm = poomsaeFlow.includes('vermelho');
              const isApresentando = poomsaeFlow.startsWith('apresentando');
              const atletaNome = (isVerm ? lutaAtual.atleta_vermelho : lutaAtual.atleta_azul)?.split(' (')[0];
              const cor = isVerm ? 'red' : 'blue';
              const deducoes = isVerm ? deducoesVermelho : deducoesAzul;
              const scores = isVerm ? poomsaeScoresVermelho : poomsaeScoresAzul;
              const resOutro = isVerm ? null : poomsaeMatchVermelho?.resultado;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Coluna 1: Atleta + Deduções + Timer */}
                  <div className={`lg:col-span-1 ${isVerm ? 'bg-red-900/20 border-red-800' : 'bg-blue-900/20 border-blue-800'} border-2 rounded-2xl p-5 flex flex-col gap-4`}>
                    <div className="text-center">
                      <p className={`text-xs font-black tracking-widest uppercase mb-1 ${isVerm ? 'text-red-400' : 'text-blue-400'}`}>
                        {isVerm ? '🔴 Chong' : '🔵 Hong'} — {isApresentando ? 'Apresentando' : 'Aguardando notas'}
                      </p>
                      <h2 className="text-2xl font-black text-white truncate">{atletaNome}</h2>
                      <p className="text-gray-400 text-sm">{lutaAtual.poomsae_1 || 'Forma a definir'}</p>
                    </div>

                    {/* Timer */}
                    <div className="text-center">
                      <div className={`text-6xl font-black tabular-nums ${tempo <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatarTempo(tempo)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tipoPoomsae === 'Freestyle' ? 'Livre: 90–100 s (fora = −0.3)' : 'Máx: 90 s'}
                      </p>
                      {isApresentando && (
                        <div className="flex gap-2 mt-3 justify-center">
                          <button onClick={toggleTempo} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg font-bold">
                            {tempoRodando ? <Pause size={20}/> : <Play size={20}/>}
                          </button>
                          <button onClick={() => resetarRelogio(getTempoLimitePoomsae())} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg font-bold">
                            <RotateCcw size={20}/>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Deduções */}
                    {isApresentando && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Deduções</p>
                        <button
                          onClick={() => applyDeducaoPoomsae(isVerm ? 'vermelho' : 'azul', 'zona')}
                          className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${deducoes.saiu_zona ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {deducoes.saiu_zona ? '✓ ' : ''}Saiu da Zona −0.3
                        </button>
                        <button
                          onClick={() => applyDeducaoPoomsae(isVerm ? 'vermelho' : 'azul', 'tempo')}
                          className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${deducoes.fora_do_tempo ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {deducoes.fora_do_tempo ? '✓ ' : ''}Fora do Tempo −0.3
                        </button>
                        <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                          <span className="text-sm font-bold text-gray-300">Kyeong-go</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-black ${deducoes.num_kyeong_go >= 2 ? 'text-red-500 animate-pulse' : deducoes.num_kyeong_go === 1 ? 'text-yellow-400' : 'text-white'}`}>
                              {deducoes.num_kyeong_go}/2
                            </span>
                            <button
                              onClick={() => applyDeducaoPoomsae(isVerm ? 'vermelho' : 'azul', 'kyeong_go')}
                              disabled={deducoes.num_kyeong_go >= 2}
                              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white px-3 py-1 rounded font-bold text-sm"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                        {deducoes.desqualificado && (
                          <div className="bg-red-900 border border-red-500 rounded-lg p-2 text-center">
                            <p className="text-red-300 font-black text-sm">⛔ DESQUALIFICADO</p>
                            <p className="text-red-400 text-xs">2 Kyeong-go</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Encerrar botão */}
                    {isApresentando && (
                      <button
                        onClick={isVerm ? encerrarApresentacaoVermelho : encerrarApresentacaoAzul}
                        className={`w-full py-3 rounded-xl font-black text-lg uppercase tracking-wider transition-colors shadow-lg ${isVerm ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'} text-white`}
                      >
                        ■ Encerrar Apresentação
                      </button>
                    )}
                  </div>

                  {/* Coluna 2: Progresso de notas */}
                  <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-2xl p-5">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 text-center">
                      {isApresentando ? 'Notas em Tempo Real' : 'Coletando Notas dos Juízes'}
                    </p>
                    {scores.recebidos?.length === 0 && scores.pendentes?.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">
                        {isApresentando ? 'Aguardando fim da apresentação...' : 'Aguardando árbitros...'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scores.recebidos?.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-green-900/30 border border-green-700 rounded-lg px-3 py-2">
                            <span className="text-green-300 text-sm font-bold">Juiz #{s.numero_juiz}</span>
                            <span className="text-white font-black">{s.total?.toFixed(2) ?? '—'}</span>
                            <span className="text-xs text-green-400">✓</span>
                          </div>
                        ))}
                        {scores.pendentes?.map((n, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                            <span className="text-gray-400 text-sm">Juiz #{n}</span>
                            <span className="text-gray-600 text-xs animate-pulse">aguardando...</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isApresentando && scores.pendentes?.length > 0 && (
                      <p className="text-yellow-400 text-xs text-center mt-3 animate-pulse">
                        ⏳ {scores.pendentes.length} árbitro(s) faltando...
                      </p>
                    )}
                    {!isApresentando && scores.pendentes?.length === 0 && scores.recebidos?.length > 0 && (
                      <p className="text-green-400 text-xs text-center mt-3 font-bold">
                        ✓ Todas as notas recebidas! Calculando...
                      </p>
                    )}
                  </div>

                  {/* Coluna 3: Resultado do outro atleta (se disponível) */}
                  <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-2xl p-5">
                    {resOutro ? (
                      <>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 text-center">
                          🔴 Resultado Chong
                        </p>
                        <div className="text-center mb-4">
                          <p className="text-gray-400 text-xs">Pontuação Final</p>
                          <p className="text-white text-5xl font-black">{resOutro.pontuacao_final?.toFixed(3)}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          {resOutro.detalhe_acuracia && (
                            <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                              <span className="text-gray-400">Acurácia</span>
                              <span className="text-white font-bold">{resOutro.detalhe_acuracia.media?.toFixed(3)}</span>
                            </div>
                          )}
                          {resOutro.detalhe_apresentacao && (
                            <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                              <span className="text-gray-400">Apresentação</span>
                              <span className="text-white font-bold">{resOutro.detalhe_apresentacao.media?.toFixed(3)}</span>
                            </div>
                          )}
                          {resOutro.detalhe_habilidade_tecnica && (
                            <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                              <span className="text-gray-400">Hab. Técnica</span>
                              <span className="text-white font-bold">{resOutro.detalhe_habilidade_tecnica.media?.toFixed(3)}</span>
                            </div>
                          )}
                          {resOutro.total_deducoes < 0 && (
                            <div className="flex justify-between bg-red-900/30 border border-red-800 rounded px-3 py-1">
                              <span className="text-red-400">Deduções</span>
                              <span className="text-red-400 font-bold">{resOutro.total_deducoes?.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="text-gray-500 text-sm">
                          {isVerm ? 'Hong ainda não apresentou' : 'Resultado Chong aparecerá aqui'}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* ─────────────────────────────────────────────────────
                FLOW: RESULTADO FINAL — Comparação lado a lado
            ───────────────────────────────────────────────────── */}
            {poomsaeFlow === 'resultado' && poomsaeMatchVermelho?.resultado && poomsaeMatchAzul?.resultado && (() => {
              const resV = poomsaeMatchVermelho.resultado;
              const resA = poomsaeMatchAzul.resultado;
              const finalV = resV.pontuacao_final ?? 0;
              const finalA = resA.pontuacao_final ?? 0;
              const liderando = finalV > finalA ? 'red' : finalA > finalV ? 'blue' : 'tie';

              const AtletaResultado = ({ res, atletaNome, cor }) => (
                <div className={`flex-1 rounded-2xl p-6 border-4 ${cor === 'red' ? (liderando === 'red' ? 'bg-red-900/30 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'bg-red-900/20 border-red-800') : (liderando === 'blue' ? 'bg-blue-900/30 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'bg-blue-900/20 border-blue-800')}`}>
                  <p className={`text-xs font-black tracking-widest uppercase mb-1 ${cor === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {cor === 'red' ? '🔴 Chong' : '🔵 Hong'}
                    {liderando === cor && <span className="ml-2 text-yellow-400">★ Liderando</span>}
                  </p>
                  <h3 className="text-xl font-black text-white truncate mb-3">{atletaNome}</h3>

                  <div className="text-center mb-4 bg-black/40 rounded-xl py-3">
                    <p className="text-xs text-gray-400 mb-1">Pontuação Final</p>
                    <p className="text-white text-5xl font-black">{res.pontuacao_final?.toFixed(3)}</p>
                    {res.total_deducoes < 0 && (
                      <p className="text-red-400 text-xs mt-1">Deduções: {res.total_deducoes?.toFixed(1)}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {res.detalhe_acuracia && (
                      <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                        <span className="text-gray-400">Acurácia</span>
                        <span className="text-white font-bold">{res.detalhe_acuracia.media?.toFixed(3)}</span>
                      </div>
                    )}
                    {res.detalhe_apresentacao && (
                      <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                        <span className="text-gray-400">Apresentação</span>
                        <span className="text-white font-bold">{res.detalhe_apresentacao.media?.toFixed(3)}</span>
                      </div>
                    )}
                    {res.detalhe_habilidade_tecnica && (
                      <div className="flex justify-between bg-gray-900 rounded px-3 py-1">
                        <span className="text-gray-400">Hab. Técnica</span>
                        <span className="text-white font-bold">{res.detalhe_habilidade_tecnica.media?.toFixed(3)}</span>
                      </div>
                    )}
                  </div>

                  {res.soma_total_scores && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Soma bruta: {res.soma_total_scores?.toFixed(2)}
                    </div>
                  )}
                </div>
              );

              return (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <AtletaResultado
                      res={resV}
                      atletaNome={lutaAtual.atleta_vermelho?.split(' (')[0]}
                      cor="red"
                    />
                    <AtletaResultado
                      res={resA}
                      atletaNome={lutaAtual.atleta_azul?.split(' (')[0]}
                      cor="blue"
                    />
                  </div>

                  {liderando === 'tie' && (
                    <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-3 text-center">
                      <p className="text-yellow-300 font-black">⚠️ EMPATE — Aplicar critério de desempate WT</p>
                    </div>
                  )}

                  <button
                    onClick={confirmarResultadoPoomsae}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg transition-colors"
                  >
                    {liderando === 'tie' ? 'Confirmar (Desempate Necessário)' : `Confirmar Vitória ${liderando === 'red' ? 'Chong' : 'Hong'}`}
                  </button>
                </div>
              );
            })()}

            {/* ─────────────────────────────────────────────────────
                FLOW: ENCERRADA
            ───────────────────────────────────────────────────── */}
            {(poomsaeFlow === 'encerrada' || statusLuta === 'encerrada') && (
              <div className="flex flex-col items-center gap-6 py-6">
                <Trophy size={60} className="text-yellow-400" />
                <h3 className="text-3xl font-black text-white uppercase">
                  Vencedor: {vencedor === 'red' ? (lutaAtual.atleta_vermelho?.split(' (')[0]) : (lutaAtual.atleta_azul?.split(' (')[0])}
                </h3>
                <button
                  onClick={encerrarESalvarLuta}
                  disabled={loadingLuta}
                  className="bg-omega-red hover:bg-red-700 text-white px-10 py-5 rounded-xl font-black text-xl uppercase tracking-wider transition-colors shadow-lg flex items-center gap-3"
                >
                  {loadingLuta ? t('salvando') : t('salvar_proxima_luta')} <ArrowRight size={24} />
                </button>
              </div>
            )}

          </section>

        ) : (
          // ==========================================
          // LAYOUT PARA KYORUGUI (LUTA VERMELHO VS AZUL)
          // ==========================================
          <>
            {/* 🔴 ALERTA: LATERAL DESCONECTOU DURANTE A LUTA */}
            {alertaLateralCaiu && (
              <div className="lg:col-span-12 bg-red-900/60 border-3 border-red-500 rounded-xl p-4 text-center mb-6 animate-pulse">
                <p className="text-red-300 font-black text-lg">
                  ⚠️ LATERAL DESCONECTOU!
                </p>
                <p className="text-xs text-red-400 mt-2">A luta foi pausada. Aguarde a reconexão do lateral...</p>
                <p className="text-sm text-red-300 mt-2 font-bold">{alertaLateralCaiu}</p>
              </div>
            )}

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