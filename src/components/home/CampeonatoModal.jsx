import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { encontrarCategoriasAtleta } from '../../utils/enquadramento';
import { API_BASE_URL } from '../../services/api';

export function CampeonatoModal({ campeonato, usuario, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [modalidadeAtiva, setModalidadeAtiva] = useState('Kyorugui');
  const [isParatleta, setIsParatleta] = useState(false);
  const [loadingInscricao, setLoadingInscricao] = useState(false);
  const [categoriasSugeridas, setCategoriasSugeridas] = useState({});

  // Calcular categorias quando componente monta ou usuario muda
  React.useEffect(() => {
    if (campeonato && usuario) {
      const matches = encontrarCategoriasAtleta(usuario, campeonato.categorias, isParatleta);
      setCategoriasSugeridas(matches);
      
      // Auto-seleciona a aba correta
      if (matches.kyorugui) setModalidadeAtiva('Kyorugui');
      else if (matches.poomsae) setModalidadeAtiva('Poomsae');
      else if (isParatleta) setModalidadeAtiva('Parataekwondo');
    }
  }, [campeonato, usuario, isParatleta]);

  const confirmarInscricao = async () => {
    const categoriaParaSalvar = categoriasSugeridas[modalidadeAtiva.toLowerCase()];
    if (!categoriaParaSalvar) {
      alert(t('nenhuma_categoria') + " " + modalidadeAtiva);
      return;
    }

    setLoadingInscricao(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/inscricoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campeonato_id: campeonato._id,
          atleta_email: usuario.email,
          categoria_id: categoriaParaSalvar.id,
          modalidade: categoriaParaSalvar.modalidade
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Inscrição no ${modalidadeAtiva} confirmada com sucesso!`);
        onClose();
      } else {
        alert(data.detail);
      }
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert(t('erro_inscricao'));
    } finally {
      setLoadingInscricao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-omega-dark">{campeonato.nome}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(campeonato.data_evento).toLocaleDateString('pt-BR')} - {campeonato.local}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-500 font-bold text-xl"
          >
            &times;
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {!usuario ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">{t('precisa_logar')}</p>
              <button 
                onClick={() => navigate('/login')} 
                className="bg-omega-red text-white py-3 px-8 rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                {t('fazer_login')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <h4 className="text-lg font-bold text-gray-800 mb-2 text-center">
                {t('enquadramento_automatico')}
              </h4>
              
              {/* Paratleta Flag */}
              {campeonato.inclui_parataekwondo && (
                <label className="flex items-center justify-center gap-2 mb-4 bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isParatleta} 
                    onChange={(e) => setIsParatleta(e.target.checked)} 
                    className="w-4 h-4 accent-omega-red" 
                  />
                  <span className="text-sm font-semibold text-gray-700">{t('sou_paratleta')}</span>
                </label>
              )}

              {/* Modality Tabs */}
              <div className="flex border-b border-gray-200 mb-4 justify-center gap-4">
                {['Kyorugui', 'Poomsae', 'Parataekwondo'].map(mod => {
                  if (mod === 'Parataekwondo' && !campeonato.inclui_parataekwondo) return null;
                  if (mod !== 'Parataekwondo' && !campeonato.modalidades.includes(mod) && campeonato.modalidades !== 'Poomsae e Kyorugui') return null;
                  
                  return (
                    <button 
                      key={mod} 
                      onClick={() => setModalidadeAtiva(mod)}
                      className={`pb-2 font-bold text-sm border-b-4 transition-colors ${
                        modalidadeAtiva === mod 
                          ? 'border-omega-red text-omega-red' 
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>

              {/* Category Display */}
              <div className="min-h-[120px]">
                {categoriasSugeridas[modalidadeAtiva.toLowerCase()] ? (
                  <div className="w-full bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col gap-2 shadow-inner">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                      <span className="font-bold text-blue-900 text-lg">
                        {categoriasSugeridas[modalidadeAtiva.toLowerCase()].idade_genero}
                      </span>
                      <span className="bg-blue-200 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {modalidadeAtiva}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-800 mt-1">
                      <span>
                        <strong>{t('graduacao')}</strong> {categoriasSugeridas[modalidadeAtiva.toLowerCase()].graduacao}
                      </span>
                      <span>
                        <strong>{modalidadeAtiva === 'Poomsae' ? t('tipo') : t('peso')}</strong> {categoriasSugeridas[modalidadeAtiva.toLowerCase()].peso_ou_tipo}
                      </span>
                    </div>
                    {categoriasSugeridas[modalidadeAtiva.toLowerCase()].pesagem && (
                      <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded">
                        {t('aviso_pesagem')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col items-center gap-2">
                    <p className="text-red-700 font-bold text-center">
                      {t('nenhuma_categoria')} {modalidadeAtiva}.
                    </p>
                    <p className="text-xs text-red-600 text-center">
                      {t('aviso_verificar_perfil')}
                    </p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full mt-6">
                <button 
                  onClick={onClose} 
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('cancelar')}
                </button>
                <button 
                  onClick={confirmarInscricao} 
                  disabled={loadingInscricao}
                  className="flex-1 bg-omega-red text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingInscricao ? t('carregando') : t('confirmar_inscricao')}
                </button>
              </div>

              {/* Ofício Link */}
              {campeonato.oficio_url && (
                <a 
                  href={campeonato.oficio_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="mt-6 text-sm text-center w-full block text-omega-dark font-semibold hover:underline"
                >
                  {t('visualizar_oficio')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
