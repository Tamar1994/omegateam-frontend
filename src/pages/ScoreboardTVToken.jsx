import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import omegaLogo from '../assets/omega-logo.png';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * ScoreboardTV - Scoreboard Profissional para TV
 * Versão acessada via token (acesso dedicado para TV)
 * Exibe todas as lutas de uma quadra em sequência
 * Mostra logo Omega quando aguardando luta
 */
export function ScoreboardTVToken() {
  const { numero_quadra } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [lutaAtual, setLutaAtual] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Verificar se acesso foi autorizado
  useEffect(() => {
    if (!location.state?.acesso_autorizado) {
      navigate('/scoreboard');
    }
  }, [location.state, navigate]);

  // ==========================================
  // POLLING: BUSCAR LUTA ATUAL DA QUADRA
  // ==========================================
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scoreboard/quadra/${numero_quadra}/luta-atual`);
        if (res.ok) {
          const dados = await res.json();
          setLutaAtual(dados.luta);
          setCarregando(false);
        } else {
          setErro('Quadra não encontrada');
          setCarregando(false);
        }
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
        setErro('Erro de conexão');
        setCarregando(false);
      }
    };

    buscarDados();
    const intervalo = setInterval(buscarDados, 2000); // Poll a cada 2 segundos
    return () => clearInterval(intervalo);
  }, [numero_quadra]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-2xl font-black">CARREGANDO PLACAR...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-2xl font-black mb-4">⚠️ {erro}</p>
          <button
            onClick={() => navigate('/scoreboard')}
            className="px-6 py-3 bg-omega-red hover:bg-red-700 text-white font-bold rounded-lg"
          >
            Voltar para Acesso
          </button>
        </div>
      </div>
    );
  }

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

  // ==========================================
  // RENDERIZAÇÃO: KYORUGUI vs POOMSAE
  // ==========================================

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
