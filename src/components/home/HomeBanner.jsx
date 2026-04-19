import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Globe, ShieldCheck, MonitorPlay } from 'lucide-react';
import omegaLogo from '../../assets/omega-logo.png';

export function HomeBanner({ usuario, isLoggedIn, onLogout }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogout = () => {
    onLogout();
    setMenuAberto(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        
        <div className="flex items-center gap-3">
          <img src={omegaLogo} alt="Omega Team" className="h-12 object-contain" />
        </div>        

        <div className="flex items-center gap-6">
          {/* Language Selector */}
          <div className="flex items-center gap-2 text-gray-600">
            <Globe size={18} />
            <select 
              onChange={changeLanguage} 
              defaultValue={i18n.language} 
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none"
            >
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>

          {/* Auth Section */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-4 border-l pl-6 border-gray-200">
              <button 
                onClick={() => navigate('/login')} 
                className="text-omega-dark hover:text-omega-red font-semibold transition-colors"
              >
                {t('entrar')}
              </button>
              <button 
                onClick={() => navigate('/cadastro')} 
                className="bg-omega-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-sm"
              >
                {t('cadastrar')}
              </button>
            </div>
          ) : (
            <div className="relative border-l pl-6 border-gray-200">
              <button 
                onClick={() => setMenuAberto(!menuAberto)}
                className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <img 
                  src={usuario?.foto || 'https://via.placeholder.com/40'} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full border-2 border-omega-red bg-gray-200" 
                />
                <span className="font-semibold text-gray-700 hidden sm:block">
                  {usuario?.nome} {usuario?.sobrenome}
                </span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-2 flex flex-col z-50">
                  
                  {/* Admin Button */}
                  {usuario?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-3 px-4 py-2 text-omega-red font-bold hover:bg-red-50 text-left w-full transition-colors"
                      >
                        <ShieldCheck size={18} /> {t('painel_admin')}
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                    </>
                  )}

                  {/* Arbitrator Button */}
                  {(usuario?.role === 'admin' || usuario?.role === 'arbitro') && (
                    <>
                      <button 
                        onClick={() => navigate('/painel-arbitro')}
                        className="flex items-center gap-3 px-4 py-2 text-blue-600 font-bold hover:bg-blue-50 text-left w-full transition-colors"
                      >
                        <MonitorPlay size={18} /> {t('sessao_arbitro')}
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                    </>
                  )}

                  {/* Profile & Settings */}
                  <button 
                    onClick={() => navigate('/perfil')} 
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 text-left w-full transition-colors"
                  >
                    <User size={18} /> {t('meu_perfil')}
                  </button>
                  <button 
                    onClick={() => navigate('/configuracoes')} 
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 text-left w-full transition-colors"
                  >
                    <Settings size={18} /> {t('configuracoes')}  
                  </button>
                  <div className="h-px bg-gray-100 my-2"></div>
                  
                  {/* Logout */}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 text-left w-full transition-colors font-medium"
                  >
                    <LogOut size={18} /> {t('sair')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
