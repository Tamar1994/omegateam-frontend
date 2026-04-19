import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronRight } from 'lucide-react';

export function CampeonatosList({ campeonatos, onSelectCampeonato }) {
  const { t } = useTranslation();

  if (campeonatos.length === 0) {
    return (
      <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-100 text-center">
        {t('nenhum_evento')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {campeonatos.map(camp => (
        <div 
          key={camp._id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h3 className="text-xl font-bold text-gray-800">{camp.nome}</h3>
            <p className="text-gray-500 text-sm mt-1">{camp.modalidades}</p>
            <div className="flex items-center gap-2 mt-3 text-gray-600">
              <Calendar size={16} className="text-omega-red" />
              <span className="font-medium">
                {new Date(camp.data_evento).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap bg-green-100 text-green-700">
              {camp.status}
            </span>
            <button 
              onClick={() => onSelectCampeonato(camp)} 
              className="flex items-center justify-center gap-1 text-omega-red font-semibold hover:text-red-800 transition-colors group"
            >
              {t('inscrever_se')} 
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
