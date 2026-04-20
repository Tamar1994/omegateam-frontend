import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function MuralNoticias() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarNoticias();
  }, []);

  const buscarNoticias = async () => {
    try {
      setCarregando(true);
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/noticias?limit=3`);
      const dados = await resposta.json();
      
      if (dados.noticias && Array.isArray(dados.noticias)) {
        setNoticias(dados.noticias);
      }
    } catch (erro) {
      console.error('Erro ao buscar notícias:', erro);
      setNoticias([]);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataIso) => {
    try {
      const data = new Date(dataIso);
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dataIso;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-omega-dark mb-4 border-b pb-2">
        {t('mural-avisos')}
      </h2>
      <div className="flex flex-col gap-4">
        {carregando ? (
          <p className="text-gray-500 text-sm italic">Carregando notícias...</p>
        ) : noticias.length > 0 ? (
          noticias.map(noticia => (
            <div key={noticia._id} className="group cursor-pointer">
              <h4 className="font-semibold text-gray-800 group-hover:text-omega-red transition-colors line-clamp-2">
                {noticia.titulo}
              </h4>
              <p className="text-sm text-gray-500 mt-1">{formatarData(noticia.data_criacao)}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm italic">Nenhuma notícia no momento</p>
        )}
      </div>
      <button 
        onClick={() => navigate('/noticias')}
        className="w-full mt-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-omega-red rounded-lg transition-colors border border-gray-200"
      >
        {t('ver_todas_noticias')}
      </button>
    </div>
  );
}
