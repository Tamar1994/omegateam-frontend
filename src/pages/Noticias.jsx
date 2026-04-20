import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

export function Noticias() {
  const { t } = useTranslation();
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarTodasANoticias();
  }, []);

  const buscarTodasANoticias = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
      const resposta = await fetch(`${apiUrl}/api/noticias?limit=50`);
      
      if (!resposta.ok) throw new Error('Erro ao buscar notícias');
      
      const dados = await resposta.json();
      if (dados.noticias && Array.isArray(dados.noticias)) {
        setNoticias(dados.noticias);
      }
    } catch (erro) {
      console.error('Erro ao buscar notícias:', erro);
      setErro('Erro ao carregar notícias');
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataIso) => {
    try {
      const data = new Date(dataIso);
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataIso;
    }
  };

  const getTipoIcon = (tipo) => {
    const iconMap = {
      'sortear_poomsae': '✨',
      'resultado': '🏆',
      'geral': '📢',
      'atualização': '🔔'
    };
    return iconMap[tipo] || '📌';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-omega-red flex items-center gap-1 text-sm font-bold mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-omega-dark">
            📰 {t('mural-avisos')} - Todas as Notícias
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            {carregando ? 'Carregando...' : `Total: ${noticias.length} notícia(s)`}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {carregando ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">
              <div className="animate-spin mb-4 text-center">⏳</div>
              <p>Carregando notícias...</p>
            </div>
          </div>
        ) : erro ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">{erro}</p>
            <button
              onClick={buscarTodasANoticias}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : noticias.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {noticias.map(noticia => (
              <div 
                key={noticia._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getTipoIcon(noticia.tipo)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-omega-dark">
                      {noticia.titulo}
                    </h3>
                    {noticia.conteudo && (
                      <p className="text-gray-600 mt-2 text-sm">
                        {noticia.conteudo}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span>📅 {formatarData(noticia.data_criacao)}</span>
                      {noticia.tipo !== 'geral' && (
                        <span className="bg-omega-red bg-opacity-10 text-omega-red px-2 py-1 rounded">
                          {noticia.tipo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">Nenhuma notícia no momento</p>
            <p className="text-gray-500 text-sm mt-2">
              Volte mais tarde para conferir as atualizações
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
