import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, MapPin, Users, Trophy, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function AtletaEventoHoje() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [usuario, setUsuario] = useState(null);
  const [lutas, setLutas] = useState([]);
  const [proximaLuta, setProximaLuta] = useState(null);
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (!usuarioSalvo) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(usuarioSalvo);
    setUsuario(parsedUser);
    carregarMinhasLutas(parsedUser.email);
  }, [navigate]);

  const carregarMinhasLutas = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/meu-perfil/minhas-lutas?email=${encodeURIComponent(email)}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar lutas');
      }
      
      const data = await response.json();
      
      // Filtrar lutas de hoje (não Encerrada e não Cancelado)
      const lutasHoje = data.lutas.filter(
        l => l.status !== "Encerrada" && l.status !== "Cancelado"
      );
      
      setLutas(lutasHoje);
      
      // Definir próxima luta
      if (lutasHoje.length > 0) {
        setProximaLuta(lutasHoje[0]);
      }
    } catch (err) {
      console.error('Erro:', err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarHorario = (horario) => {
    if (!horario) return "A definir";
    if (typeof horario === 'string') return horario;
    return new Date(horario).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obterCorStatus = (status) => {
    switch (status) {
      case "Em Andamento":
        return "from-green-600 to-green-700";
      case "Aguardando Chamada":
        return "from-yellow-600 to-yellow-700";
      case "Aguardando":
        return "from-blue-600 to-blue-700";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  const obterEmoji = (status) => {
    switch (status) {
      case "Em Andamento":
        return "🔴";
      case "Aguardando Chamada":
        return "⏰";
      case "Aguardando":
        return "⏳";
      default:
        return "📋";
    }
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-4xl md:text-5xl font-black mb-2">🥋 Seu Evento de Hoje</h1>
        <p className="text-gray-400">Atleta: {usuario.nome}</p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="font-bold">Erro ao carregar</p>
            <p className="text-sm text-gray-300">{erro}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin">
              <Trophy className="text-yellow-400" size={40} />
            </div>
            <p className="text-gray-400 mt-4">Carregando suas lutas...</p>
          </div>
        </div>
      )}

      {/* Próxima Luta - Card Principal */}
      {!loading && proximaLuta && (
        <div className={`bg-gradient-to-r ${obterCorStatus(proximaLuta.status)} rounded-xl p-8 mb-8 shadow-2xl border border-white/10`}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">{obterEmoji(proximaLuta.status)}</span>
            <h2 className="text-3xl font-black">
              {proximaLuta.status === "Em Andamento" ? "SUA LUTA ESTÁ ACONTECENDO AGORA!" : "Próxima Luta"}
            </h2>
          </div>

          {/* Combate - Layout VS */}
          <div className="bg-black/30 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Você */}
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-2 font-semibold">VOCÊ</p>
                <p className="text-3xl md:text-4xl font-black break-words">{proximaLuta.meu_nome}</p>
                <p className="text-xs text-gray-400 mt-1">{proximaLuta.meu_lado.toUpperCase()}</p>
              </div>

              {/* VS */}
              <div className="text-center">
                <p className="text-5xl md:text-6xl font-black text-yellow-400">VS</p>
                <p className="text-xs text-gray-400 mt-2">{proximaLuta.categoria}</p>
              </div>

              {/* Adversário */}
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-2 font-semibold">ADVERSÁRIO</p>
                <p className="text-3xl md:text-4xl font-black break-words">{proximaLuta.adversario_nome}</p>
                <p className="text-xs text-gray-400 mt-1">{proximaLuta.meu_lado === 'vermelho' ? 'AZUL' : 'VERMELHO'}</p>
              </div>
            </div>
          </div>

          {/* Informações da Luta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
              <MapPin className="text-yellow-400 flex-shrink-0" size={24} />
              <div>
                <p className="text-xs text-gray-300 font-semibold">QUADRA</p>
                <p className="text-xl font-bold">{proximaLuta.quadra || "A definir"}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
              <Clock className="text-yellow-400 flex-shrink-0" size={24} />
              <div>
                <p className="text-xs text-gray-300 font-semibold">HORÁRIO</p>
                <p className="text-xl font-bold">{formatarHorario(proximaLuta.horario_previsto)}</p>
              </div>
            </div>
          </div>

          {/* Botão - Assistir Luta */}
          {proximaLuta.modalidade === "Kyorugui" && (
            <button
              onClick={() => navigate(`/live/${proximaLuta.campeonato_id}`)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 px-6 rounded-lg text-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🔴</span>
              ASSISTIR LUTA AO VIVO
            </button>
          )}

          {proximaLuta.modalidade === "Poomsae" && (
            <div className="bg-blue-600/30 border border-blue-400 rounded-lg p-4 text-center">
              <p className="font-bold">Modalidade: POOMSAE</p>
              <p className="text-sm text-gray-300 mt-2">Apresentação individual. Acompanhe o cronograma.</p>
            </div>
          )}
        </div>
      )}

      {/* Sem Lutas */}
      {!loading && lutas.length === 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-600 rounded-xl p-12 text-center">
          <Trophy className="mx-auto text-blue-400 mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2">Nenhuma luta agendada para hoje</h3>
          <p className="text-gray-400 mb-6">
            Verifique o cronograma completo ou volte para ver suas lutas.
          </p>
          <button
            onClick={() => navigate('/minhas-lutas')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Ver Todas as Minhas Lutas
          </button>
        </div>
      )}

      {/* Todas as Lutas de Hoje */}
      {!loading && lutas.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Users size={28} />
            Todas as Suas Lutas de Hoje ({lutas.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lutas.map((luta, idx) => (
              <div
                key={luta.luta_id}
                className="bg-gradient-to-r from-gray-700/50 to-gray-600/30 border border-gray-600 rounded-lg p-4 hover:border-yellow-400 transition cursor-pointer"
                onClick={() => {
                  // Scroll para próxima luta se clicar em uma diferente
                  if (luta.luta_id !== proximaLuta?.luta_id) {
                    const element = document.querySelector('[data-luta-' + luta.luta_id + ']');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Número */}
                  <div className="text-center md:text-left">
                    <p className="text-xs text-gray-400 font-semibold">LUTA #{idx + 1}</p>
                    <p className="text-lg font-bold">
                      {luta.meu_nome} <span className="text-yellow-400">vs</span> {luta.adversario_nome}
                    </p>
                  </div>

                  {/* Quadra e Horário */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400">📍 {luta.quadra || "A definir"}</p>
                    <p className="text-xs text-gray-400">🕐 {formatarHorario(luta.horario_previsto)}</p>
                  </div>

                  {/* Categoria */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold">CATEGORIA</p>
                    <p className="text-sm font-bold">{luta.categoria}</p>
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <p className={`text-sm font-bold px-3 py-1 rounded inline-block ${
                      luta.status === 'Em Andamento' ? 'bg-red-600/80 text-red-100' :
                      luta.status === 'Aguardando Chamada' ? 'bg-yellow-600/80 text-yellow-100' :
                      'bg-blue-600/80 text-blue-100'
                    }`}>
                      {obterEmoji(luta.status)} {luta.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      {!loading && proximaLuta && proximaLuta.status === "Aguardando Chamada" && (
        <div className="mt-8 bg-orange-600/20 border border-orange-500 rounded-lg p-4 text-center">
          <p className="font-bold text-lg">⚠️ ATENÇÃO!</p>
          <p className="text-sm mt-2">Apresente-se COM 15 MINUTOS DE ANTECEDÊNCIA na quadra indicada.</p>
          <p className="text-sm text-gray-300 mt-2">Atrasos podem resultar em desclassificação.</p>
        </div>
      )}
    </div>
  );
}
