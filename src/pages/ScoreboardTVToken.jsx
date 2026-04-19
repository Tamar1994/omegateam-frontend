import React, { useState, useEffect } from 'react';
import { Lock, Zap } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Scoreboard - Página FIXA e única para Scoreboard TV
 * 
 * 1. Input do token (XXXX-XXXX)
 * 2. Validação do token
 * 3. Polling de lutas usando token armazenado
 * 4. Exibição de lutas ou logo standby
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
          <img src={omegaLogo} alt="Omega Team" className="h-32 bg-white p-4 rounded-lg shadow-lg" />
          <p className="text-white text-3xl font-black tracking-widest">AGUARDANDO PRÓXIMA LUTA</p>
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
// COMPONENTE: KYORUGUI
// ==========================================
function ScoreboardKyorugui({ luta }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Informações da Luta */}
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg">KYORUGUI - {luta.nome_categoria}</p>
        <p className="text-white text-xl font-bold">{luta.atleta_vermelho?.split(' (')[0]} vs {luta.atleta_azul?.split(' (')[0]}</p>
      </div>

      {/* Placar Gigante */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Vermelho */}
        <div className="bg-red-950/50 border-4 border-red-600 rounded-3xl p-12 text-center">
          <p className="text-red-400 text-2xl font-bold mb-4">🔴 VERMELHO</p>
          <p className="text-red-600 text-8xl font-black tabular-nums mb-6">
            {luta.placar_red || 0}
          </p>
          <div className="space-y-2">
            <p className="text-red-400">Faltas: <span className="text-4xl font-black">{luta.faltas_red || 0}/10</span></p>
          </div>
        </div>

        {/* Azul */}
        <div className="bg-blue-950/50 border-4 border-blue-600 rounded-3xl p-12 text-center">
          <p className="text-blue-400 text-2xl font-bold mb-4">🔵 AZUL</p>
          <p className="text-blue-600 text-8xl font-black tabular-nums mb-6">
            {luta.placar_blue || 0}
          </p>
          <div className="space-y-2">
            <p className="text-blue-400">Faltas: <span className="text-4xl font-black">{luta.faltas_blue || 0}/10</span></p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Round {luta.round || 1} • Status: {luta.status || 'Aguardando'}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: POOMSAE
// ==========================================
function ScoreboardPoomsae({ luta }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Informações da Luta */}
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg">POOMSAE - {luta.nome_categoria}</p>
        <p className="text-white text-xl font-bold">{luta.atleta_vermelho?.split(' (')[0]} vs {luta.atleta_azul?.split(' (')[0]}</p>
      </div>

      {/* Notas Gigantes */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Vermelho */}
        <div className="bg-red-950/50 border-4 border-red-600 rounded-3xl p-12 text-center">
          <p className="text-red-400 text-2xl font-bold mb-4">🔴 CHONG</p>
          <p className="text-red-600 text-7xl font-black tabular-nums">
            {luta.nota_red?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Azul */}
        <div className="bg-blue-950/50 border-4 border-blue-600 rounded-3xl p-12 text-center">
          <p className="text-blue-400 text-2xl font-bold mb-4">🔵 HONG</p>
          <p className="text-blue-600 text-7xl font-black tabular-nums">
            {luta.nota_azul?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Status: {luta.status || 'Aguardando'}
        </p>
      </div>
    </div>
  );
}
