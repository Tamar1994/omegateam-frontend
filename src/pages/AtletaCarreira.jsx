import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Zap, TrendingUp, Calendar, Users, Download, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function AtletaCarreira() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [usuario, setUsuario] = useState(null);
  const [carreira, setCarreira] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    const usuarioArmazenado = JSON.parse(localStorage.getItem('usuarioOmegaTeam'));
    
    if (!usuarioArmazenado) {
      navigate('/login');
      return;
    }
    
    setUsuario(usuarioArmazenado);
    carregarCarreira(usuarioArmazenado.email);
  }, []);

  const carregarCarreira = async (email) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/meu-perfil/carreira?email=${email}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar carreira');
      }
      
      const dados = await res.json();
      setCarreira(dados);
      setErro(null);
    } catch (err) {
      console.error('Erro:', err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const baixarCertificado = async (campeonatoId) => {
    try {
      setDownloadingCert(campeonatoId);
      const res = await fetch(`${API_BASE_URL}/api/meu-perfil/certificado/${campeonatoId}?email=${usuario.email}`);
      
      if (!res.ok) {
        throw new Error('Erro ao gerar certificado');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${campeonatoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setDownloadingCert(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-400">{t('carregando') || 'Carregando...'}</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Usuário não autenticado</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900 to-red-900 p-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 mb-4 transition"
          >
            <ArrowLeft size={20} />
            {t('voltar') || 'Voltar'}
          </button>
          
          <h1 className="text-4xl font-black mb-2">🏆 {t('sua_carreira') || 'Sua Carreira'}</h1>
          <p className="text-gray-300">{usuario.nome || usuario.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        
        {erro && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200">{erro}</p>
          </div>
        )}

        {carreira && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">{t('competicoes') || 'Competições'}</p>
                    <p className="text-4xl font-black text-yellow-400">{carreira.total_competicoes}</p>
                  </div>
                  <Trophy className="text-yellow-500 opacity-50" size={32} />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">{t('lutas_totais') || 'Lutas'}</p>
                    <p className="text-4xl font-black text-blue-400">{carreira.total_lutas}</p>
                  </div>
                  <Zap className="text-blue-500 opacity-50" size={32} />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">{t('vitorias') || 'Vitórias'}</p>
                    <p className="text-4xl font-black text-green-400">{carreira.vitorias}</p>
                  </div>
                  <TrendingUp className="text-green-500 opacity-50" size={32} />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">{t('taxa_vitoria') || 'Taxa'}</p>
                    <p className="text-4xl font-black text-purple-400">{carreira.taxa_vitoria}</p>
                  </div>
                  <TrendingUp className="text-purple-500 opacity-50" size={32} />
                </div>
              </div>
            </div>

            {/* Medals Section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <Trophy size={24} className="text-yellow-500" />
                {t('medalhas') || 'Medalhas'}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 rounded-lg p-4 text-center border border-yellow-600/30">
                  <p className="text-5xl mb-2">🥇</p>
                  <p className="text-gray-400 text-sm font-bold uppercase mb-2">{t('ouro') || 'Ouro'}</p>
                  <p className="text-3xl font-black text-yellow-400">{carreira.medalhas.ouro}</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4 text-center border border-gray-500/30">
                  <p className="text-5xl mb-2">🥈</p>
                  <p className="text-gray-400 text-sm font-bold uppercase mb-2">{t('prata') || 'Prata'}</p>
                  <p className="text-3xl font-black text-gray-300">{carreira.medalhas.prata}</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4 text-center border border-orange-600/30">
                  <p className="text-5xl mb-2">🥉</p>
                  <p className="text-gray-400 text-sm font-bold uppercase mb-2">{t('bronze') || 'Bronze'}</p>
                  <p className="text-3xl font-black text-orange-600">{carreira.medalhas.bronze}</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4 text-center border border-blue-600/30">
                  <p className="text-5xl mb-2">🎖️</p>
                  <p className="text-gray-400 text-sm font-bold uppercase mb-2">{t('participacao') || 'Participação'}</p>
                  <p className="text-3xl font-black text-blue-400">{carreira.medalhas.participacao}</p>
                </div>
              </div>
            </div>

            {/* Competitions History */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <Calendar size={24} className="text-yellow-500" />
                {t('historico_competicoes') || 'Histórico de Competições'}
              </h2>

              {carreira.historico.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">{t('sem_competicoes') || 'Nenhuma competição registrada'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carreira.historico.map((competicao, idx) => (
                    <div key={idx} className="bg-black/40 rounded-lg p-4 border border-gray-700 hover:border-yellow-600 transition">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-yellow-400 mb-2">
                            {competicao.campeonato_nome}
                          </h3>
                          
                          {competicao.lutas.length > 0 && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <p><span className="font-bold text-white">{competicao.lutas.length}</span> luta(s) nesta competição</p>
                              <p>
                                Status: 
                                <span className={`ml-2 font-bold ${
                                  competicao.lutas.some(l => l.resultado === 'Vitória') 
                                    ? 'text-green-400' 
                                    : 'text-red-400'
                                }`}>
                                  {competicao.lutas.filter(l => l.resultado === 'Vitória').length}V -{' '}
                                  {competicao.lutas.filter(l => l.resultado === 'Derrota').length}D
                                </span>
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => baixarCertificado(competicao.campeonato_id)}
                          disabled={downloadingCert === competicao.campeonato_id}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-lg transition whitespace-nowrap"
                        >
                          {downloadingCert === competicao.campeonato_id ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              {t('gerando') || 'Gerando'}
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              {t('certificado') || 'Certificado'}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Fights list (collapsible) */}
                      {competicao.lutas.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="grid grid-cols-1 gap-2">
                            {competicao.lutas.slice(0, 3).map((luta, lutaIdx) => (
                              <div key={lutaIdx} className="text-xs text-gray-400 flex items-center justify-between">
                                <div>
                                  vs <span className="font-bold text-white">{luta.adversario}</span> ({luta.categoria})
                                </div>
                                <span className={`font-bold ${
                                  luta.resultado === 'Vitória' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {luta.placar.seu_placar} x {luta.placar.placar_adversario}
                                </span>
                              </div>
                            ))}
                            {competicao.lutas.length > 3 && (
                              <p className="text-xs text-gray-500 italic mt-2">
                                +{competicao.lutas.length - 3} {t('mais') || 'mais'} luta(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
