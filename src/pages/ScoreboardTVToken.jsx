import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * ScoreboardTV - Scoreboard Profissional para TV
 * Versão acessada via token (acesso dedicado para TV)
 */
export function ScoreboardTVToken() {
  const { luta_id, numero_quadra } = useParams();
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
  // POLLING: BUSCAR DADOS DA LUTA ATUAL
  // ==========================================
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lutas/${luta_id}/luta-atual`);
        if (res.ok) {
          const dados = await res.json();
          setLutaAtual(dados);
          setCarregando(false);
        } else {
          setErro('Luta não encontrada');
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
  }, [luta_id]);

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

  if (!lutaAtual) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-2xl font-black">AGUARDANDO LUTA...</p>
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
        <p className="text-gray-400 text-lg">KYORUGUI - {luta.categoria}</p>
        <p className="text-white text-xl font-bold">{luta.atleta_vermelho} vs {luta.atleta_azul}</p>
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
            <p className="text-red-400">Faltas: <span className="text-4xl font-black">{luta.faltas_red || 0}</span></p>
          </div>
        </div>

        {/* Azul */}
        <div className="bg-blue-950/50 border-4 border-blue-600 rounded-3xl p-12 text-center">
          <p className="text-blue-400 text-2xl font-bold mb-4">🔵 AZUL</p>
          <p className="text-blue-600 text-8xl font-black tabular-nums mb-6">
            {luta.placar_blue || 0}
          </p>
          <div className="space-y-2">
            <p className="text-blue-400">Faltas: <span className="text-4xl font-black">{luta.faltas_blue || 0}</span></p>
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
        <p className="text-gray-400 text-lg">POOMSAE - {luta.categoria}</p>
        <p className="text-white text-xl font-bold">{luta.atleta_vermelho} vs {luta.atleta_azul}</p>
      </div>

      {/* Notas */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Vermelho */}
        <div className="bg-red-950/50 border-4 border-red-600 rounded-3xl p-12 text-center">
          <p className="text-red-400 text-2xl font-bold mb-4">🔴 CHONG</p>
          <p className="text-red-600 text-8xl font-black tabular-nums">
            {luta.nota_red || '0.00'}
          </p>
        </div>

        {/* Azul */}
        <div className="bg-blue-950/50 border-4 border-blue-600 rounded-3xl p-12 text-center">
          <p className="text-blue-400 text-2xl font-bold mb-4">🔵 HONG</p>
          <p className="text-blue-600 text-8xl font-black tabular-nums">
            {luta.nota_azul || '0.00'}
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
