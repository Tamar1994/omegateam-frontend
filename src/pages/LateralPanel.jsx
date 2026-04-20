import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { JoystickPoomsae } from '../components/JoystickPoomsae';

/**
 * LateralPanel - Painel do Árbitro Lateral (Joystick)
 * 
 * Funcionalidades Avançadas:
 * ✅ WebSocket para comunicação em tempo real
 * ✅ Haptic Feedback (vibração do telemóvel)
 * ✅ Wake Lock API (evita escurecer a tela)
 * ✅ Prevenção de duplos cliques (debounce)
 * ✅ Validação por Janela de Coincidência
 */
export function LateralPanel() {
  const { t } = useTranslation();
  const { id: campId } = useParams();  // ✅ A rota usa "/lateral/:id", não ":campId"
  const navigate = useNavigate();

  // ==========================================
  // ESTADOS
  // ==========================================
  const [usuario, setUsuario] = useState(null);
  const [luta, setLuta] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [status, setStatus] = useState('conectando');
  const [ultimos_cliques, setUltimosCliques] = useState([]);
  const [bloqueado, setBloqueado] = useState(false); // Prevenção de duplos cliques
  const [telaAtiva, setTelaAtiva] = useState(true); // Wake Lock
  const [backendOk, setBackendOk] = useState(null); // Teste de conectividade com backend

  // ==========================================
  // REFS
  // ==========================================
  const ws = useRef(null);
  const wakeLock = useRef(null);
  const ultimoClique = useRef(0); // Timestamp do último clique

  // ==========================================
  // EFEITOS
  // ==========================================

  // 0. Testar conectividade com backend
  useEffect(() => {
    const testarBackend = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/api/joystick/health`);
        const data = await response.json();
        
        console.log('✅ Backend OK:', data);
        setBackendOk(true);
      } catch (error) {
        console.error('❌ Backend NÃO acessível:', error);
        setBackendOk(false);
      }
    };

    testarBackend();
  }, []);

  // 1. Carregar usuário e conectar WebSocket
  useEffect(() => {
    const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioOmegaTeam') || '{}');
    setUsuario(usuarioSalvo);

    console.group('📱 INICIANDO LATERALPANEL');
    console.log('Campus ID:', campId);
    console.log('Usuário:', usuarioSalvo);
    console.groupEnd();

    if (usuarioSalvo.email && campId) {
      console.log('✅ Dados OK, conectando WebSocket...');
      conectarWebSocket(usuarioSalvo.email);
      iniciarWakeLock();
    } else {
      console.error('❌ Faltam dados:', { email: usuarioSalvo.email, campId });
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      liberarWakeLock();
    };
  }, [campId]);

  // 2. Monitorar visibilidade da página para Wake Lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Página escondida - liberando Wake Lock');
        setTelaAtiva(false);
        liberarWakeLock();
      } else {
        console.log('📱 Página visível - ativando Wake Lock');
        setTelaAtiva(true);
        iniciarWakeLock();
      }
    };

    // Monitorar se Wake Lock é liberado pelo navegador
    const handleWakeLockRelease = () => {
      console.warn('⚠️ Wake Lock foi liberado pelo navegador');
      wakeLock.current = null;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (wakeLock.current) {
      wakeLock.current.addEventListener('release', handleWakeLockRelease);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock.current) {
        try {
          wakeLock.current.removeEventListener('release', handleWakeLockRelease);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // ==========================================
  // WEBSOCKET
  // ==========================================

  const conectarWebSocket = (email) => {
    // Validação: campId não pode estar vazio
    if (!campId) {
      console.error('❌ ERRO CRÍTICO: campId não foi recebido');
      console.error('📍 URL da página:', window.location.href);
      console.error('📍 Pathname:', window.location.pathname);
      setStatus('erro_conexao');
      setConectado(false);
      return;
    }

    if (!email) {
      console.error('❌ ERRO CRÍTICO: email do usuário não está disponível');
      console.error('📍 Usuario:', usuario);
      setStatus('erro_conexao');
      setConectado(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    // ⚠️ IMPORTANTE: URL-encode o email para evitar problemas com @
    const emailCodificado = encodeURIComponent(email);
    const hostBackend = baseUrl.split('//')[1] || 'localhost:8000';
    const wsUrl = `${protocol}//${hostBackend}/api/ws/lateral/${campId}/${emailCodificado}`;

    console.group('🔗 CONECTANDO WEBSOCKET');
    console.log('Protocol:', protocol);
    console.log('Base URL:', baseUrl);
    console.log('Host Backend:', hostBackend);
    console.log('Camp ID:', campId);
    console.log('Email:', email);
    console.log('Email Codificado:', emailCodificado);
    console.log('URL FINAL:', wsUrl);
    console.groupEnd();

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket ABERTO e CONECTADO!');
      setConectado(true);
      setStatus('pronto');
      
      // 🎯 AUTO-RENDERIZAR JOYSTICK SE HÁ LUTA EM ANDAMENTO
      buscarLutaAtual();
    };

    // Função auxiliar para buscar luta atual do servidor
    const buscarLutaAtual = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/api/campeonatos/${campId}/luta-atual`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.luta && data.luta.id) {
            console.log('🎬 LUTA EM ANDAMENTO ENCONTRADA! Auto-renderizando joystick...');
            setLuta({
              id: data.luta.id,
              modalidade: data.luta.modalidade,
              atleta_vermelho: data.luta.atleta_vermelho,
              atleta_azul: data.luta.atleta_azul
            });
            fazerVibracaoMedia();
          } else {
            console.log('⏳ Aguardando próxima luta...');
            setLuta(null);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar luta atual:', error);
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Mensagem recebida:', data);
      console.log('📊 Estado atual - Luta:', luta, 'Status:', status, 'Conectado:', conectado);

      // ✅ LATERAL PRONTO CONFIRMADO - O Mesário agora sabe que você está pronto
      if (data.status === 'pronto_confirmado') {
        console.log('✅ VOCÊ ESTÁ PRONTO! O Mesário foi notificado');
        fazerVibracaoSimples();
        setStatus('pronto');
        return;
      }

      // � LUTA FINALIZADA - Reseta e aguarda próxima luta
      if (data.status === 'luta_finalizada') {
        console.log('🏁 LUTA FINALIZADA! Aguardando próxima...');
        fazerVibracaoLonga();
        setLuta(null);
        setStatus('pronto');
        return;
      }

      // �🎯 NOVA LUTA INICIADA - determina tipo de joystick
      if (data.status === 'luta_iniciada') {
        console.log(`🎬 LUTA INICIADA RECEBIDA!`);
        console.log(`  - Luta ID: ${data.luta_id}`);
        console.log(`  - Modalidade: ${data.modalidade}`);
        console.log(`  - Atletas: ${data.atleta_vermelho} vs ${data.atleta_azul}`);
        
        setLuta({
          id: data.luta_id,
          modalidade: data.modalidade, // 'Kyorugui' ou 'Poomsae'
          atleta_vermelho: data.atleta_vermelho,
          atleta_azul: data.atleta_azul
        });
        setStatus('pronto');
        fazerVibracaoMedia();
        console.log('✅ Joystick renderizado');
        return;
      }

      if (data.status === 'clique_recebido') {
        // Vibração curta para confirmar recebimento
        fazerVibracaoSimples();
      } else if (data.status === 'ponto_validado') {
        // Vibração forte para ponto validado
        fazerVibracaoLonga();
        setStatus('ponto_validado');
        setTimeout(() => setStatus('pronto'), 2000);
      }
    };

    ws.current.onerror = (error) => {
      console.group('❌ ERRO WEBSOCKET');
      console.error('Erro:', error);
      console.error('ReadyState:', ws.current?.readyState, '(0=connecting, 1=open, 2=closing, 3=closed)');
      console.error('URL:', ws.current?.url);
      console.error('Protocolo:', ws.current?.protocol);
      console.groupEnd();
      setConectado(false);
      setStatus('erro_conexao');
    };

    ws.current.onclose = (event) => {
      console.group('❌ WEBSOCKET FECHADO');
      console.log('Code:', event.code);
      console.log('Reason:', event.reason);
      console.log('wasClean:', event.wasClean);
      console.log('Codes comuns: 1000=normal, 1006=anormal, 1009=msg grande');
      console.groupEnd();
      setConectado(false);
      setStatus('desconectado');
      
      // Tentar reconectar em 3 segundos se não foi fechado normalmente
      if (!event.wasClean) {
        console.log('🔄 Tentando reconectar em 3 segundos...');
        setTimeout(() => conectarWebSocket(email), 3000);
      }
    };
  };

  // ==========================================
  // HAPTIC FEEDBACK (Vibração)
  // ==========================================

  const fazerVibracaoSimples = () => {
    /**
     * Vibração curta para confirmação de clique
     * Padrão: 50ms de vibração
     */
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const fazerVibracaoMedia = () => {
    /**
     * Vibração média para ponto normal (+1)
     * Padrão: 100ms
     */
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const fazerVibracaoForte = () => {
    /**
     * Vibração forte para pontos altos (+2, +3)
     * Padrão: padrão de dois pulsos (200ms, pausa, 100ms)
     */
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 100]);
    }
  };

  const fazerVibracaoLonga = () => {
    /**
     * Vibração longa para validação de ponto
     * Padrão: 500ms
     */
    if (navigator.vibrate) {
      navigator.vibrate(500);
    }
  };

  // ==========================================
  // WAKE LOCK API
  // ==========================================

  const iniciarWakeLock = async () => {
    /**
     * Mantém a tela acesa durante o jogo
     * Evita que o telemóvel escureça ou bloqueie
     */
    try {
      if (!('wakeLock' in navigator)) {
        console.warn('⚠️ Wake Lock não suportado por este navegador');
        return;
      }

      if (!telaAtiva) {
        console.warn('⚠️ Tela não está ativa, não posso ativar Wake Lock');
        return;
      }

      // Se já tem um Wake Lock, libera antes
      if (wakeLock.current) {
        try {
          await wakeLock.current.release();
        } catch (e) {
          console.warn('⚠️ Erro ao liberar Wake Lock anterior:', e);
        }
      }

      wakeLock.current = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock ativado - tela não vai escurecer');
    } catch (err) {
      console.error('❌ Erro ao ativar Wake Lock:', err.message, err.name);
      wakeLock.current = null;
    }
  };

  const liberarWakeLock = () => {
    /**
     * Libera o Wake Lock permitindo o telemóvel voltar ao normal
     */
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
      console.log('❌ Wake Lock desativado');
    }
  };

  // ==========================================
  // PREVENÇÃO DE DUPLOS CLIQUES
  // ==========================================

  const podeEnviarClique = () => {
    /**
     * Bloqueia cliques duplos dentro de 200ms
     * Evita tremores acidentais do dedo
     */
    const agora = Date.now();
    if (agora - ultimoClique.current < 200) {
      return false; // Clique muito rápido
    }
    ultimoClique.current = agora;
    return true;
  };

  // ==========================================
  // MARCAR COMO PRONTO (AGUARDANDO LUTA)
  // ==========================================
  const marcarProto = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket não conectado!');
      return;
    }

    console.log('✋ Marcando como pronto...');
    fazerVibracaoMedia();
    
    ws.current.send(JSON.stringify({
      tipo: 'lateral_pronto',
      luta_id: luta?.id,  // ✅ Enviar luta_id se disponível (após receber notificação)
      email: usuario.email,
      timestamp: new Date().toISOString()
    }));

    setStatus('aguardando_luta');
  };

  // ==========================================
  // ENVIAR CLIQUE VIA WEBSOCKET
  // ==========================================

  const enviarClique = async (tipo_ponto, cor) => {
    /**
     * Envia clique do árbitro via WebSocket
     * 
     * tipo_ponto: "+1", "+2", "+3"
     * cor: "vermelho" ou "azul"
     */

    // Validação 1: Prevenção de duplos cliques
    if (!podeEnviarClique()) {
      console.warn('⚠️ Clique bloqueado - muitos cliques muito rápido');
      fazerVibracaoSimples(); // Feedback de rejeição
      return;
    }

    // Validação 2: WebSocket conectado
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setStatus('erro_conexao');
      return;
    }

    // Bloquear novos cliques por 200ms
    setBloqueado(true);
    setTimeout(() => setBloqueado(false), 200);

    // Vibração apropriada
    const pontos = parseInt(tipo_ponto.substring(1));
    if (pontos === 1) {
      fazerVibracaoMedia();
    } else {
      fazerVibracaoForte();
    }

    // Enviar via WebSocket
    const dados = {
      tipo_ponto,
      cor,
      luta_id: luta?.id,  // ✅ IMPORTANTE: Enviar luta_id para o backend identificar qual luta
      timestamp: new Date().toISOString(),
      lateral_email: usuario?.email
    };

    console.log('📤 Enviando clique:', dados);
    ws.current.send(JSON.stringify(dados));

    // Atualizar feedback visual
    setUltimosCliques([{ ...dados, id: Date.now() }, ...ultimos_cliques.slice(0, 4)]);
    setStatus('enviado');
    setTimeout(() => setStatus('pronto'), 1000);
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans">
      {/* Header */}
      <div className="bg-black/50 border-b border-omega-red/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:text-omega-red transition"
          >
            <ArrowLeft size={20} /> {t('voltar_inicio')}
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-omega-red">
              {t('juiz_lateral')}
            </h1>
            <p className="text-gray-400 text-sm">{usuario?.email}</p>
          </div>
          <div
            className={`w-4 h-4 rounded-full ${
              conectado ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
            title={conectado ? 'Conectado' : 'Desconectado'}
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-black/30 border-b border-omega-red/20 p-4 text-center">
        <p className="text-sm">
          Status:{' '}
          <span
            className={`font-bold ${
              status === 'pronto'
                ? 'text-green-400'
                : status === 'ponto_validado'
                ? 'text-green-500'
                : 'text-yellow-400'
            }`}
          >
            {t(status === 'pronto' ? 'estou_pronto' : 'sincronizando_joystick')}
          </span>
        </p>
        {!conectado && (
          <p className="text-red-400 text-xs mt-2">
            ⚠️ {t('erro_sincronizar')} - Tentando reconectar...
          </p>
        )}
        {backendOk === false && (
          <p className="text-orange-400 text-xs mt-2">
            ⚠️ Backend não acessível! Verifique a conexão de internet.
          </p>
        )}
      </div>

      {/* Área Principal - Condicional */}
      {!luta ? (
        // ==========================================
        // TELA DE AGUARDANDO
        // ==========================================
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-omega-red border-t-white"></div>
              </div>
              
              <div>
                <h2 className="text-3xl font-black mb-2">{t('check_in_equipe')}</h2>
                <p className="text-gray-400 text-sm">{t('aguardando_juizes_sincronizar')}</p>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 border border-omega-red/30 space-y-2">
                <p className="text-xs text-gray-400">Status da Conexão:</p>
                <p className="text-sm font-bold">
                  <span className={conectado ? 'text-green-400' : 'text-red-400'}>
                    {conectado ? '✅ Conectado' : '❌ Desconectado'}
                  </span>
                </p>
              </div>

              <button
                onClick={marcarProto}
                disabled={!conectado}
                className="w-full py-6 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed
                           rounded-2xl font-black text-xl tracking-widest uppercase transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-green-400"
              >
                ✋ {t('estou_pronto')}
              </button>

              <p className="text-xs text-gray-500">
                Clique em "ESTOU PRONTO" quando estiver pronto para a luta. O mesário puxará a luta em seguida.
              </p>
            </div>
          </div>
        </div>
      ) : luta.modalidade === 'Poomsae' ? (
        // ==========================================
        // JOYSTICK POOMSAE
        // ==========================================
        <JoystickPoomsae luta={luta} usuario={usuario} ws={ws} t={t} />
      ) : (
        // ==========================================
        // JOYSTICK KYORUGUI (PADRÃO)
        // ==========================================
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
            {/* BOTÕES VERMELHO */}
            <div className="space-y-4">
              <h2 className="text-center font-bold text-red-400 text-lg">
                {t('cor_vermelha', { cor: 'Vermelho' })} 🔴
              </h2>

              {/* +1 Vermelho */}
              <button
                onClick={() => enviarClique('+1', 'vermelho')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-red-400"
              >
                <div className="text-5xl md:text-6xl">+1</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_baixo', { ponto: 'Ponto' })}
                </div>
              </button>

              {/* +2 Vermelho */}
              <button
                onClick={() => enviarClique('+2', 'vermelho')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-red-400"
              >
                <div className="text-5xl md:text-6xl">+2</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_chute', { ponto: 'Chute' })}
                </div>
              </button>

              {/* +3 Vermelho */}
              <button
                onClick={() => enviarClique('+3', 'vermelho')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-red-500"
              >
                <div className="text-5xl md:text-6xl">+3</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_cabeca', { ponto: 'Cabeça' })}
                </div>
              </button>
            </div>

            {/* BOTÕES AZUL */}
            <div className="space-y-4">
              <h2 className="text-center font-bold text-blue-400 text-lg">
                {t('cor_azul', { cor: 'Azul' })} 🔵
              </h2>

              {/* +1 Azul */}
              <button
                onClick={() => enviarClique('+1', 'azul')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-blue-400"
              >
                <div className="text-5xl md:text-6xl">+1</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_baixo', { ponto: 'Ponto' })}
                </div>
              </button>

              {/* +2 Azul */}
              <button
                onClick={() => enviarClique('+2', 'azul')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-blue-400"
              >
                <div className="text-5xl md:text-6xl">+2</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_chute', { ponto: 'Chute' })}
                </div>
              </button>

              {/* +3 Azul */}
              <button
                onClick={() => enviarClique('+3', 'azul')}
                disabled={bloqueado || !conectado}
                className="w-full py-8 md:py-12 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 
                           rounded-2xl font-bold text-2xl md:text-4xl transition-all transform 
                           hover:scale-105 active:scale-95 shadow-2xl border-2 border-blue-500"
              >
                <div className="text-5xl md:text-6xl">+3</div>
                <div className="text-xs md:text-sm mt-2 opacity-80">
                  {t('ponto_cabeca', { ponto: 'Cabeça' })}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log de Cliques Recentes */}
      {ultimos_cliques.length > 0 && (
        <div className="bg-black/50 border-t border-omega-red/30 p-4">
          <h3 className="text-xs text-gray-400 mb-2">Últimos cliques:</h3>
          <div className="flex gap-2 flex-wrap">
            {ultimos_cliques.map((clique) => (
              <span
                key={clique.id}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  clique.cor === 'vermelho'
                    ? 'bg-red-900 text-red-200'
                    : 'bg-blue-900 text-blue-200'
                }`}
              >
                {clique.cor[0].toUpperCase()} {clique.tipo_ponto}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-black/30 border-t border-gray-700 p-3 text-center text-xs text-gray-500">
        <div className="flex justify-center gap-4 flex-wrap">
          <span title="Backend acessível">
            🖥️ {backendOk === true ? '✅' : backendOk === false ? '❌' : '⏳'} Backend
          </span>
          <span title="WebSocket conectado">
            🔌 {conectado ? '✅' : '❌'} WebSocket
          </span>
          <span title="Wake Lock ativo">
            📱 {wakeLock.current ? '✅' : '❌'} Wake Lock
          </span>
          <span title="Haptic Feedback disponível">
            📳 {navigator.vibrate ? '✅' : '❌'} Vibração
          </span>
          <span title="Tela ativa">
            💡 {telaAtiva ? '✅' : '❌'} Tela Ativa
          </span>
        </div>
      </div>
    </div>
  );
}

export default LateralPanel;