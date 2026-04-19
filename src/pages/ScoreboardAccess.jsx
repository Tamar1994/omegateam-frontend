import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';

/**
 * ScoreboardAccess - Página de Acesso ao Scoreboard
 * 
 * Permite TV acessar o Scoreboard inserindo token único XXXX-XXXX
 * Token é fornecido pelo Mesário e expira após primeira utilização
 */
export function ScoreboardAccess() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
        setErro(data.detail || 'Token inválido ou expirado');
        setCarregando(false);
        return;
      }

      const data = await response.json();
      
      // ✅ Token válido - redirecionar para Scoreboard
      navigate(`/scoreboard-tv/${data.numero_quadra}`, {
        state: { token, acesso_autorizado: true, campeonato_id: data.campeonato_id }
      });
    } catch (err) {
      console.error('Erro ao validar token:', err);
      setErro('Erro ao conectar com o servidor');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-omega-dark via-gray-900 to-black flex items-center justify-center p-4">
      {/* Container Gradiente */}
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
          {/* Input Token */}
          <div>
            <label htmlFor="token" className="block text-sm font-bold text-gray-300 mb-2">
              <Lock className="inline mr-2" size={16} />
              CÓDIGO DE ACESSO
            </label>
            <input
              id="token"
              type="text"
              placeholder="XXXX-XXXX"
              value={token}
              onChange={handleTokenChange}
              maxLength={9}
              className="w-full px-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-white text-center text-2xl font-black tracking-widest placeholder-gray-500 focus:border-omega-red focus:outline-none transition-all uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Exemplo: AB12-CD34</p>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-3">
              <p className="text-red-300 text-sm font-bold">⚠️ {erro}</p>
            </div>
          )}

          {/* Botão de Acesso */}
          <button
            type="submit"
            disabled={carregando || token.length !== 9}
            className="w-full py-4 bg-gradient-to-r from-omega-red to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-black text-lg rounded-lg transition-all shadow-lg shadow-omega-red/50 disabled:shadow-none uppercase tracking-wider"
          >
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Validando...
              </span>
            ) : (
              'ACESSAR SCOREBOARD'
            )}
          </button>
        </form>

        {/* Informação Adicional */}
        <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            Este código é único por luta e pode ser usado apenas uma vez. <br />
            Pedir um novo código ao Mesário se necessário.
          </p>
        </div>
      </div>
    </div>
  );
}
