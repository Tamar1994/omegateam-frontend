import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { API_BASE_URL } from '../services/api';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', senha: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Salva os dados do usuário no navegador
        localStorage.setItem('usuarioOmegaTeam', JSON.stringify(data.usuario));
        navigate('/'); // Redireciona para a Home
      } else {
        alert(data.detail); // Exibe "E-mail ou senha incorretos"
      }
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <div className="w-full max-w-4xl mx-auto p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-omega-red transition-colors font-medium">
          <ArrowLeft size={20} /> {t('voltar_inicio')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
          
          <div className="text-center mb-8 border-b border-gray-100 pb-6">
            <img src={omegaLogo} alt="Omega Team" className="h-24 mx-auto mb-4 object-contain" />
            <h2 className="text-2xl font-bold text-omega-dark">{t('bem_vindo_volta')}</h2>
            <p className="text-gray-500 mt-2 text-sm">{t('faca_login')}</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange} required 
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none transition-all" 
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">{t('senha')}</label>
                <a href="#" className="text-xs font-semibold text-omega-red hover:underline">{t('esqueceu_senha')}</a>
              </div>
              <input 
                type="password" name="senha" value={formData.senha} onChange={handleChange} required 
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none transition-all" 
              />
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-omega-dark text-white py-3 rounded-lg font-bold text-lg hover:bg-black transition-colors shadow-md disabled:bg-gray-400 mt-4">
              {loading ? t('aguarde') : <>{t('entrar_sistema')} <LogIn size={20} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {t('nao_tem_conta')} <Link to="/cadastro" className="font-bold text-omega-red hover:underline">{t('cadastrar')}</Link>
          </div>

        </div>
      </div>
    </div>
  );
}