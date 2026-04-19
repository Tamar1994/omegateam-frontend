import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { API_BASE_URL } from '../services/api';

export function Cadastro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [emailErro, setEmailErro] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '', sobrenome: '', email: '', cpf_passaporte: '', senha: '', confirmar_senha: '',
    sexo: 'M', nascimento: '', peso: '', altura: '', graduacao: '', 
    registro_federacao: '', registro_cbtkd: '', registro_kukkiwon: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checarEmail = async (e) => {
    const emailDigitado = e.target.value;
    if (!emailDigitado || !emailDigitado.includes('@')) {
      setEmailErro(''); // Limpa se estiver vazio ou incompleto
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/verificar-email/${emailDigitado}`);
      const data = await response.json();
      
      if (!data.disponivel) {
        setEmailErro(t('email_em_uso'));
      } else {
        setEmailErro('');
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      alert(t('erro_disponibilidade_email'));
    }
  };

  const solicitarToken = async (e) => {
    e.preventDefault();
    
    if (emailErro) {
      return alert(t('usar_email_diferente'));
    }

    if (formData.senha !== formData.confirmar_senha) {
      return alert(t('senha_nao_confere')   );
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/enviar-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          peso: parseFloat(formData.peso) || 0,
          altura: parseFloat(formData.altura) || 0
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEtapa(2);
      } else {
        alert(t('erro') + ": " + data.detail);
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      alert(t('ERRO_GENERICO_conexao'));
    } finally {
      setLoading(false);
    }
  };

  const validarToken = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/validar-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          token: tokenDigitado
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(t('conta_ativada_sucesso'));
        navigate('/'); // Redireciona para a Home (ou para a futura rota de login)
      } else {
        alert(t('erro') + ": " + data.detail);
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      alert(t('ERRO_GENERICO_conexao'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Botão Voltar */}
      <div className="w-full max-w-4xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-omega-red transition-colors font-medium">
          <ArrowLeft size={20} /> {t('voltar_inicio')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-12">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 w-full max-w-4xl">
          
          <div className="text-center mb-10 border-b border-gray-100 pb-8">
            <img src={omegaLogo} alt="Omega Team" className="h-20 mx-auto mb-4 object-contain" />
            <h2 className="text-3xl font-bold text-omega-dark">
            {etapa === 1 ? t('cadastro_titulo') : t('verifique_email')}
            </h2>
          </div>
          
          {etapa === 1 ? (
            /* --- ETAPA 1: FORMULÁRIO DE CADASTRO --- */
            <form className="space-y-8" onSubmit={solicitarToken}>
              
              {/* Seção 1: Conta e Acesso */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-omega-red text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                  {t('conta_e_acesso')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nome')}</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sobrenome')}</label>
                    <input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        onBlur={checarEmail} /* <--- NOVA LINHA AQUI */
                        required 
                        className={`w-full border p-3 rounded-lg focus:ring-2 outline-none transition-all ${
                        emailErro ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-omega-red'
                        }`} 
                    />
                    {/* Mensagem de erro condicional */}
                    {emailErro && <p className="text-red-500 text-xs mt-1 font-semibold">{emailErro}</p>}
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('cpf_passaporte')}</label>
                    <input type="text" name="cpf_passaporte" value={formData.cpf_passaporte} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('senha')}</label>
                    <input type="password" name="senha" value={formData.senha} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmar_senha')}</label>
                    <input type="password" name="confirmar_senha" value={formData.confirmar_senha} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados Físicos */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-omega-red text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                  {t('dados_fisicos')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sexo')}</label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white">
                      <option value="M">{t('masculino')}</option>
                      <option value="F">{t('feminino')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nascimento')}</label>
                    <input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('peso')}</label>
                    <input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('altura')}</label>
                    <input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                </div>
              </div>

              {/* Seção 3: Taekwondo */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-omega-red text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                  {t('registros_martiais')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('graduacao')}</label>
                    <select name="graduacao" value={formData.graduacao} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white">
                      <option value="" disabled>{t('selecione_sua_graduacao')}</option>
                      <option value="10_gub">{t('faixa_branca')}</option>
                      <option value="9_gub">{t('faixa_cinza_ponta_amarela')}</option>
                      <option value="8_gub">{t('faixa_amarela')}</option>
                      <option value="7_gub">{t('faixa_laranja_ponta_verde')}</option>
                      <option value="6_gub">{t('faixa_verde')}</option>
                      <option value="5_gub">{t('faixa_roxa_ponta_azul')}</option>
                      <option value="4_gub">{t('faixa_azul')}</option>
                      <option value="3_gub">{t('faixa_marrom_ponta_vermelha')}</option>
                      <option value="2_gub">{t('faixa_vermelha')}</option>
                      <option value="1_gub">{t('faixa_ponta_preta')}</option>
                      <option value="dan_poom">{t('faixa_preta')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('registro_federacao')}</label>
                    <input type="text" name="registro_federacao" value={formData.registro_federacao} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('registro_cbtkd')}</label>
                    <input type="text" name="registro_cbtkd" value={formData.registro_cbtkd} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('registro_kukkiwon')}</label>
                    <input type="text" name="registro_kukkiwon" value={formData.registro_kukkiwon} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full md:w-auto float-right bg-omega-red text-white py-3 px-8 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg disabled:bg-red-400"
                >
                    {loading ? t('aguarde') : t('enviar_token')}
                </button>
                <div className="clear-both"></div>
            </div>
            </form>

          ) : (
            
           /* --- ETAPA 2: VALIDAÇÃO DO TOKEN --- */
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle size={60} className="text-green-500 mb-6" />
              <p className="text-center text-gray-600 mb-8 max-w-md">
                {t('codigo_enviado_1')} <br/>
                <strong className="text-gray-800">{formData.email}</strong>. <br/>
                {t('codigo_enviado_2')}
              </p>

              <form onSubmit={validarToken} className="flex flex-col w-full max-w-xs gap-4">
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="000000"
                  value={tokenDigitado}
                  onChange={(e) => setTokenDigitado(e.target.value.replace(/\D/g, ''))} 
                  className="w-full border-2 border-gray-300 p-4 rounded-xl text-center text-3xl tracking-widest font-bold text-omega-dark focus:border-omega-red outline-none transition-colors"
                  required
                />
                <button type="submit" disabled={loading} className="w-full bg-omega-dark text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors disabled:bg-gray-400">
                  {loading ? t('validando') : t('confirmar_conta')}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}