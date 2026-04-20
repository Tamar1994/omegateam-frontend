import React, { useState, useEffect } from 'react';
import { Lock, Zap } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Scoreboard TV Profissional - Página FIXA para exibição em TV
 * 
 * Funcionalidades:
 * 1. Input do token (XXXX-XXXX) com validação
 * 2. Polling automático a cada 2 segundos
 * 3. Layout profissional tipo Taekwondo TV
 * 4. Placar gigante, timer, round, faltas
 * 5. Suporte Kyorugui e Poomsae
 */
export function ScoreboardTVToken() {
  const [token, setToken] = useState('');
  const [tokenValidado, setTokenValidado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [lutaAtual, setLutaAtual] = useState(null);
  
  // ==========================================
  // VALIDAÇÃO DO TOKEN
  // ==========================================
  const handleTokenChange = (e) => {
    let valor = e.target.value.toUpperCase();
    
    // Formatar automaticamente para XXXX-XXXX
    valor = valor.replace(/[^A-Z0-9-]/g, '');
    if (valor.length > 4 && !valor.includes('-')) {
      valor = valor.slice(0, 4) + '-' + valor.slice(4, 8);
    }
    valor = valor.slice(0, 9); // Máximo XXXX-XXXX
    
    setToken(valor);
  };

  const validarToken = async (e) => {
    e.preventDefault();
    
    if (!token || token.length !== 9) {
      setErro('Token deve estar no formato XXXX-XXXX');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scoreboard/access/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        setErro(data.detail || 'Token inválido');
        setCarregando(false);
        return;
      }

      // ✅ Token válido - armazenar e começar polling
      sessionStorage.setItem('scoreboard_token', token);
      sessionStorage.setItem('scoreboard_acesso', 'true');
      setTokenValidado(true);
      setCarregando(false);
    } catch (err) {
      console.error('Erro ao validar token:', err);
      setErro('Erro ao conectar com o servidor');
      setCarregando(false);
    }
  };

  // ==========================================
  // POLLING: BUSCAR LUTA ATUAL USANDO TOKEN
  // ==========================================
  useEffect(() => {
    if (!tokenValidado) return;

    const buscarDados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scoreboard/luta-atual?token=${token}`);
        if (res.ok) {
          const dados = await res.json();
          setLutaAtual(dados.luta);
        } else {
          setErro('Token expirado ou inválido');
          setTokenValidado(false);
          sessionStorage.removeItem('scoreboard_token');
          sessionStorage.removeItem('scoreboard_acesso');
        }
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
        // Não mostrar erro durante polling, apenas continua tentando
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 2000); // Poll a cada 2 segundos
    return () => clearInterval(intervalo);
  }, [tokenValidado, token]);

  // ==========================================
  // TELA 1: INPUT DO TOKEN
  // ==========================================
  if (!tokenValidado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-omega-dark via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-omega-red rounded-full p-4 shadow-lg shadow-omega-red/50">
                <Zap size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">SCOREBOARD TV</h1>
            <p className="text-gray-400 text-sm">Insira o código de acesso fornecido pelo Mesário</p>
          </div>

          {/* Formulário */}
          <form onSubmit={validarToken} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-bold mb-3 text-sm tracking-widest uppercase">
                <Lock size={16} className="inline mr-2" />
                Código de Acesso
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX"
                value={token}
                onChange={handleTokenChange}
                maxLength="9"
                className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white font-black text-center text-3xl tracking-widest focus:border-omega-red focus:outline-none transition-colors"
              />
            </div>

            {erro && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
                <p className="text-red-300 font-bold text-sm">⚠️ {erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || token.length !== 9}
              className="w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-omega-red hover:bg-red-700 text-white"
            >
              {carregando ? 'VALIDANDO...' : 'ACESSAR SCOREBOARD'}
            </button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Sistema de Scoreboard profissional para competições de Taekwondo
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: EXIBIÇÃO DO SCOREBOARD
  // ==========================================

  // Logo Omega quando não há luta
  if (!lutaAtual) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <img src={omegaLogo} alt="Omega Team" className="h-40" />
          <p className="text-white text-4xl font-black tracking-widest">AGUARDANDO PRÓXIMA LUTA</p>
        </div>
      </div>
    );
  }

  // Renderizar Kyorugui ou Poomsae
  if (lutaAtual.modalidade === 'Kyorugui') {
    return <ScoreboardKyorugui luta={lutaAtual} />;
  } else if (lutaAtual.modalidade === 'Poomsae') {
    return <ScoreboardPoomsae luta={lutaAtual} />;
  }

  return null;
}

// ==========================================
// COMPONENTE: KYORUGUI PROFISSIONAL PARA TV
// ==========================================
function ScoreboardKyorugui({ luta }) {
  const extrairPais = (nome) => {
    const match = nome?.match(/\(([^)]+)\)$/);
    return match ? match[1] : '';
  };

  const pais_vermelho = extrairPais(luta.atleta_vermelho);
  const pais_azul = extrairPais(luta.atleta_azul);
  const nome_vermelho = luta.atleta_vermelho?.split(' (')[0] || 'ATLETA';
  const nome_azul = luta.atleta_azul?.split(' (')[0] || 'ATLETA';

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      
      {/* ===== LADO ESQUERDO - VERMELHO ===== */}
      <div className="flex-1 bg-red-950 border-r-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País/Bandeira */}
        <div className="text-center mb-4">
          <p className="text-red-300 text-4xl font-black tracking-widest">{pais_vermelho || 'MAR'}</p>
        </div>

        {/* Nome do Atleta */}
        <h1 className="text-center text-7xl font-black text-white leading-none mb-8 line-clamp-3">
          {nome_vermelho}
        </h1>

        {/* Placar Gigante */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <p className="text-9xl font-black text-red-400" style={{textShadow: '0 0 20px rgba(220, 38, 38, 0.8)'}}>
            {luta.placar_red || 0}
          </p>
        </div>

        {/* Faltas */}
        <div className="text-center bg-red-900/50 rounded-2xl p-6 border-4 border-red-600">
          <p className="text-red-300 text-2xl font-bold mb-2">FALTAS (GAM-JEOM)</p>
          <p className="text-7xl font-black text-red-400">{luta.faltas_red || 0}</p>
        </div>
      </div>

      {/* ===== CENTRO - ROUND E TIMER ===== */}
      <div className="w-96 bg-black border-x-8 border-yellow-400 flex flex-col items-center justify-center gap-8 p-8">
        
        {/* Round */}
        <div className="text-center">
          <p className="text-yellow-400 text-4xl font-black mb-4">ROUND</p>
          <p className="text-9xl font-black text-white">{luta.round || 1}</p>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-gray-400 text-2xl font-bold uppercase tracking-widest">
            {luta.status || 'Aguardando'}
          </p>
        </div>

        {/* Categoria */}
        <div className="text-center mt-auto text-gray-500">
          <p className="text-sm font-bold">{luta.nome_categoria || ''}</p>
        </div>
      </div>

      {/* ===== LADO DIREITO - AZUL ===== */}
      <div className="flex-1 bg-blue-950 border-l-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País/Bandeira */}
        <div className="text-center mb-4">
          <p className="text-blue-300 text-4xl font-black tracking-widest">{pais_azul || 'KOR'}</p>
        </div>

        {/* Nome do Atleta */}
        <h1 className="text-center text-7xl font-black text-white leading-none mb-8 line-clamp-3">
          {nome_azul}
        </h1>

        {/* Placar Gigante */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <p className="text-9xl font-black text-blue-400" style={{textShadow: '0 0 20px rgba(37, 99, 235, 0.8)'}}>
            {luta.placar_blue || 0}
          </p>
        </div>

        {/* Faltas */}
        <div className="text-center bg-blue-900/50 rounded-2xl p-6 border-4 border-blue-600">
          <p className="text-blue-300 text-2xl font-bold mb-2">FALTAS (GAM-JEOM)</p>
          <p className="text-7xl font-black text-blue-400">{luta.faltas_blue || 0}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: POOMSAE PROFISSIONAL PARA TV
// ==========================================
function ScoreboardPoomsae({ luta }) {
  const [segundosRestantes, setSegundosRestantes] = React.useState(null);
  const [emApresentacao, setEmApresentacao] = React.useState(false);

  // Inicializar timer quando status muda para "apresentando"
  React.useEffect(() => {
    if (luta?.status?.toLowerCase().includes('apresent')) {
      setEmApresentacao(true);
      setSegundosRestantes(90); // Time limit para Poomsae (90 segundos)
    } else {
      setEmApresentacao(false);
      setSegundosRestantes(null);
    }
  }, [luta?.status, luta?.id]);

  // Countdown timer
  React.useEffect(() => {
    if (!emApresentacao || !luta?.id) return;

    const intervalo = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [emApresentacao, luta?.id]);

  const extrairPais = (nome) => {
    const match = nome?.match(/\(([^)]+)\)$/);
    return match ? match[1] : '';
  };

  const pais_vermelho = extrairPais(luta.atleta_vermelho);
  const pais_azul = extrairPais(luta.atleta_azul);
  const nome_vermelho = luta.atleta_vermelho?.split(' (')[0] || 'ATLETA';
  const nome_azul = luta.atleta_azul?.split(' (')[0] || 'ATLETA';

  // Formatador de tempo MM:SS
  const formatarTempo = (segundos) => {
    if (segundos === null) return '--:--';
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      
      {/* ===== LADO ESQUERDO - CHONG (VERMELHO) ===== */}
      <div className="flex-1 bg-gradient-to-br from-red-950 to-red-900 border-r-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País */}
        <div className="text-center">
          <p className="text-red-300 text-5xl font-black tracking-widest mb-2">{pais_vermelho || 'MAR'}</p>
          <p className="text-red-300 text-2xl font-black">🔴 CHONG</p>
        </div>

        {/* Nome */}
        <h1 className="text-center text-5xl font-black text-white leading-tight line-clamp-2">
          {nome_vermelho}
        </h1>

        {/* 3 BOXES: ACCURACY | PRESENTATION | TOTAL */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-black/60 rounded-lg p-3 border-2 border-red-600/50 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">ACCURACY</p>
            <p className="text-red-400 text-3xl font-black">4.00</p>
          </div>
          <div className="bg-black/60 rounded-lg p-3 border-2 border-red-600/50 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">PRESENTATION</p>
            <p className="text-yellow-400 text-3xl font-black">6.00</p>
          </div>
          <div className="bg-black/60 rounded-lg p-3 border-2 border-omega-red/60 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">TOTAL</p>
            <p className="text-white text-3xl font-black">10.0</p>
          </div>
        </div>

        {/* Nota Gigante Destaque */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-9xl font-black text-red-400" style={{textShadow: '0 0 30px rgba(220, 38, 38, 1)'}}>
            {luta.nota_red?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Poomsaes apresentadas */}
        <div className="text-center bg-red-900/60 rounded-xl p-4 border-3 border-red-600">
          <p className="text-red-200 text-xs font-black mb-2">POOMSAES</p>
          <p className="text-red-300 font-black text-lg">{luta.poomsae_1 || '---'}</p>
          {luta.poomsae_2 && <p className="text-red-300 font-bold text-sm">+ {luta.poomsae_2}</p>}
        </div>
      </div>

      {/* ===== CENTRO - INFO CENTRAL ===== */}
      <div className="w-full max-w-xs bg-gradient-to-b from-black via-gray-900 to-black border-x-8 border-yellow-400 flex flex-col items-center justify-between gap-6 p-8">
        
        {/* GRANDE DESTAQUE - Qual Poomsae? */}
        {luta.poomsae_1 && (
          <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-3xl p-8 w-full text-center shadow-2xl border-4 border-yellow-300">
            <p className="text-black text-xs font-black mb-3 tracking-widest">🎯 POOMSAE SENDO EXECUTADO</p>
            <p className="text-4xl font-black text-white mb-2 drop-shadow-lg">{luta.poomsae_1}</p>
            {luta.poomsae_2 && (
              <p className="text-lg text-black font-bold drop-shadow">OU</p>
            )}
            {luta.poomsae_2 && (
              <p className="text-3xl font-black text-white mt-1 drop-shadow-lg">{luta.poomsae_2}</p>
            )}
          </div>
        )}
        
        {/* Status */}
        <div className="text-center">
          <p className="text-yellow-400 text-3xl font-black mb-3">POOMSAE</p>
          <p className="text-gray-300 text-2xl font-black uppercase tracking-widest">
            {luta.status || 'Aguardando'}
          </p>
        </div>

        {/* ⏱️ TIME LIMIT - Mostrar apenas durante apresentação */}
        {emApresentacao && (
          <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-8 w-full text-center shadow-2xl border-4 border-red-400">
            <p className="text-yellow-300 text-xs font-black mb-2 tracking-widest">⏱️ TEMPO LIMITE</p>
            <p className={`text-8xl font-black tabular-nums tracking-widest drop-shadow-lg ${
              segundosRestantes <= 10 ? 'text-yellow-300 animate-pulse' : 'text-white'
            }`}>
              {formatarTempo(segundosRestantes)}
            </p>
            <p className="text-yellow-200 text-sm mt-2 font-black">90 segundos máximo</p>
          </div>
        )}

        {/* Categoria */}
        <div className="text-center mt-auto">
          <p className="text-gray-400 text-sm font-bold">{luta.nome_categoria || ''}</p>
        </div>

        {/* Logo Omega */}
        <img src={omegaLogo} alt="Omega" className="h-20 opacity-40" />
      </div>

      {/* ===== LADO DIREITO - HONG (AZUL) ===== */}
      <div className="flex-1 bg-gradient-to-br from-blue-950 to-blue-900 border-l-8 border-yellow-400 flex flex-col justify-between p-8">
        
        {/* País */}
        <div className="text-center">
          <p className="text-blue-300 text-5xl font-black tracking-widest mb-2">{pais_azul || 'KOR'}</p>
          <p className="text-blue-300 text-2xl font-black">🔵 HONG</p>
        </div>

        {/* Nome */}
        <h1 className="text-center text-5xl font-black text-white leading-tight line-clamp-2">
          {nome_azul}
        </h1>

        {/* 3 BOXES: ACCURACY | PRESENTATION | TOTAL */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-black/60 rounded-lg p-3 border-2 border-blue-600/50 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">ACCURACY</p>
            <p className="text-blue-400 text-3xl font-black">4.00</p>
          </div>
          <div className="bg-black/60 rounded-lg p-3 border-2 border-blue-600/50 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">PRESENTATION</p>
            <p className="text-yellow-400 text-3xl font-black">6.00</p>
          </div>
          <div className="bg-black/60 rounded-lg p-3 border-2 border-omega-red/60 text-center">
            <p className="text-gray-400 text-xs font-black mb-1">TOTAL</p>
            <p className="text-white text-3xl font-black">10.0</p>
          </div>
        </div>

        {/* Nota Gigante Destaque */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-9xl font-black text-blue-400" style={{textShadow: '0 0 30px rgba(37, 99, 235, 1)'}}>
            {luta.nota_azul?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Poomsaes apresentadas */}
        <div className="text-center bg-blue-900/60 rounded-xl p-4 border-3 border-blue-600">
          <p className="text-blue-200 text-xs font-black mb-2">POOMSAES</p>
          <p className="text-blue-300 font-black text-lg">{luta.poomsae_1 || '---'}</p>
          {luta.poomsae_2 && <p className="text-blue-300 font-bold text-sm">+ {luta.poomsae_2}</p>}
        </div>
      </div>
    </div>
  );
}
