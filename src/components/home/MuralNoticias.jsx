import React from 'react';
import { useTranslation } from 'react-i18next';

export function MuralNoticias() {
  const { t } = useTranslation();

  // Mock apenas para o mural de notícias lateral
  const mockNoticias = [
    { id: 1, titulo: 'Chaves da Copa Regional já estão disponíveis!', data: '16/04/2026' },
    { id: 2, titulo: 'Atualização nas regras de pesagem para cadetes', data: '10/04/2026' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-omega-dark mb-4 border-b pb-2">
        {t('mural-avisos')}
      </h2>
      <div className="flex flex-col gap-4">
        {mockNoticias.map(noticia => (
          <div key={noticia.id} className="group cursor-pointer">
            <h4 className="font-semibold text-gray-800 group-hover:text-omega-red transition-colors">
              {noticia.titulo}
            </h4>
            <p className="text-sm text-gray-500 mt-1">{noticia.data}</p>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
        {t('ver_todas_noticias')}
      </button>
    </div>
  );
}
