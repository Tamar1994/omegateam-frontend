import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Bell, AlertTriangle, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function Configuracoes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [receberNotificacoes, setReceberNotificacoes] = useState(true);

  // Estados da Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);

  // Estados da Exclusão
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [loadingExclusao, setLoadingExclusao] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

 useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (!usuarioSalvo) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(usuarioSalvo);
      setUsuario(parsedUser);
      // Puxa a preferência salva no banco (se não existir, o padrão é true)
      setReceberNotificacoes(parsedUser.receber_notificacoes !== false); 
    }
  }, [navigate]);

  const handleToggleNotificacoes = async (e) => {
    const novoValor = e.target.checked;
    setReceberNotificacoes(novoValor); // Atualiza visualmente na mesma hora

    try {
      const response = await fetch(`${API_BASE_URL}/api/atualizar-preferencias`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: usuario.email, receber_notificacoes: novoValor })
      });

      if (response.ok) {
        // Atualiza a sessão para manter salvo quando ele recarregar a página
        const usuarioAtualizado = { ...usuario, receber_notificacoes: novoValor };
        localStorage.setItem('usuarioOmegaTeam', JSON.stringify(usuarioAtualizado));
        setUsuario(usuarioAtualizado);
      } else {
        // Se der erro no servidor, desfaz a animação do clique
        setReceberNotificacoes(!novoValor);
        alert(t('erro_salvar_preferencia_servidor'));
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      setReceberNotificacoes(!novoValor);
      alert(t('erro_conexao_preferencia'));
    }
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmarNovaSenha) {
      return alert(t('senhas_nao_conferem'));
    }

    setLoadingSenha(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/alterar-senha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: usuario.email, senha_atual: senhaAtual, nova_senha: novaSenha })
      });

      const data = await response.json();
      if (response.ok) {
        alert(t('senha_alterada_sucesso'));
        setSenhaAtual(''); setNovaSenha(''); setConfirmarNovaSenha('');
      } else {
        alert(data.detail);
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      alert(t('ERRO_GENERICO_conexao'));
    } finally {
      setLoadingSenha(false);
    }
  };

  const handleExcluirConta = async (e) => {
    e.preventDefault();
    setLoadingExclusao(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/excluir-conta`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: usuario.email, senha_confirmacao: senhaExclusao })
      });

      const data = await response.json();
      if (response.ok) {
        alert(t('conta_excluida_sucesso'));
        localStorage.removeItem('usuarioOmegaTeam');
        navigate('/');
      } else {
        alert(data.detail);
      }
    } catch (error) {
      console.error(t('erro_detalhado'), error);
      alert(t('ERRO_GENERICO_conexao'));
    } finally {
      setLoadingExclusao(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      <div className="w-full max-w-3xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-omega-red transition-colors font-medium mb-6">
          <ArrowLeft size={20} /> {t('voltar')}
        </button>

        <h2 className="text-3xl font-bold text-omega-dark mb-8">{t('configuracoes')}</h2>

        <div className="space-y-6">
          
          {/* BLOCO 1: SEGURANÇA (ALTERAR SENHA) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-3">
              <Shield size={20} className="text-omega-red" /> {t('seguranca')}
            </h3>
            
            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('senha_atual')}</label>
                <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('nova_senha')}</label>
                  <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('confirmar_senha')}</label>
                  <input type="password" value={confirmarNovaSenha} onChange={(e) => setConfirmarNovaSenha(e.target.value)} required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
                </div>
              </div>
              <button type="submit" disabled={loadingSenha} className="bg-omega-dark text-white py-2 px-6 rounded-lg font-bold hover:bg-black transition-colors disabled:bg-gray-400">
                {loadingSenha ? t('aguarde') : t('alterar_senha')}
              </button>
            </form>
          </div>

          {/* BLOCO 2: PREFERÊNCIAS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-3">
              <Bell size={20} className="text-omega-red" /> {t('preferencias')}
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={receberNotificacoes} 
                onChange={handleToggleNotificacoes} 
                className="w-5 h-5 text-omega-red focus:ring-omega-red rounded border-gray-300 cursor-pointer" 
                />
              <span className="text-gray-700 font-medium">{t('notificacoes_email')}</span>
            </label>
          </div>

          {/* BLOCO 3: ZONA DE PERIGO (EXCLUIR CONTA) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4 border-b border-red-100 pb-3">
              <AlertTriangle size={20} /> {t('zona_perigo')}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {t('excluir_conta_aviso')}
            </p>

            {!mostrarConfirmacao ? (
              <button onClick={() => setMostrarConfirmacao(true)} className="flex items-center gap-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 py-2 px-4 rounded-lg font-bold transition-colors">
                <Trash2 size={18} /> {t('excluir_conta')}
              </button>
            ) : (
              <form onSubmit={handleExcluirConta} className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
                <label className="block text-sm font-bold text-red-800 mb-2">{t('confirmar_exclusao_digitar_senha')}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="password" value={senhaExclusao} onChange={(e) => setSenhaExclusao(e.target.value)} placeholder={t('senha_atual')} required className="flex-1 border-red-300 p-2 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                  <button type="submit" disabled={loadingExclusao} className="bg-red-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:bg-red-400">
                    {loadingExclusao ? t('aguarde') : t('confirmar_exclusao')}
                  </button>
                  <button type="button" onClick={() => { setMostrarConfirmacao(false); setSenhaExclusao(''); }} className="text-gray-500 hover:text-gray-700 font-medium px-4">
                    {t('cancelar')}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}