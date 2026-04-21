import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Users, AlertCircle, Loader2, Podium } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function Rankings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { campeonatoId } = useParams();
  
  const [usuario, setUsuario] = useState(null);
  const [campeonato, setCampeonato] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroModalidade, setFiltroModalidade] = useState('todas');
  const [categorias, setCategorias] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  useEffect(() => {
    const usuarioArmazenado = JSON.parse(localStorage.getItem('usuarioOmegaTeam'));
    setUsuario(usuarioArmazenado);
    
    if (campeonatoId) {
      carregarRankings(campeonatoId);
    } else {
      carregarRankingsGerais();
    }
  }, [campeonatoId]);

  const carregarRankings = async (cid) => {
    try {
      setLoading(true);
      
      // Get tournament
      const resCamp = await fetch(`${API_BASE_URL}/api/campeonatos/${cid}`);
      if (resCamp.ok) {
        const camp = await resCamp.json();
        setCampeonato(camp);
      }
      
      // Get all results for this tournament
      const resResults = await fetch(`${API_BASE_URL}/api/campeonatos/${cid}/resultados`);
      if (resResults.ok) {
        const dados = await resResults.json();
        processarRankings(dados.resultados || []);
      } else {
        setErro('Erro ao carregar rankings');
      }
    } catch (err) {
      console.error('Erro:', err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarRankingsGerais = async () => {
    try {
      setLoading(true);
      
      // Query all results
      const resResults = await fetch(`${API_BASE_URL}/api/resultados`);
      if (resResults.ok) {
        const dados = await resResults.json();
        processarRankings(dados.resultados || []);
      } else {
        setErro('Erro ao carregar rankings');
      }
    } catch (err) {
      console.error('Erro:', err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processarRankings = (resultados) => {
    if (!Array.isArray(resultados) || resultados.length === 0) {
      setRankings([]);
      return;
    }

    // Extract unique categories and modalities
    const cats = new Set();
    const mods = new Set();
    
    resultados.forEach(r => {
      if (r.categoria_id) cats.add(r.categoria_id);
      if (r.modalidade) mods.add(r.modalidade);
    });
    
    setCategorias(Array.from(cats).sort());
    setModalidades(Array.from(mods).sort());

    // Group by category and modality
    let filtered = resultados;
    
    if (filtroCategoria !== 'todas') {
      filtered = filtered.filter(r => r.categoria_id === filtroCategoria);
    }
    
    if (filtroModalidade !== 'todas') {
      filtered = filtered.filter(r => r.modalidade === filtroModalidade);
    }

    // Calculate rankings
    const athletesMap = {};
    
    filtered.forEach(resultado => {
      const key = resultado.atleta_email;
      
      if (!athletesMap[key]) {
        athletesMap[key] = {
          email: resultado.atleta_email,
          nome: resultado.atleta_nome,
          vitorias: 0,
          derrotas: 0,
          ouro: 0,
          prata: 0,
          bronze: 0,
          participacao: 0
        };
      }
      
      if (resultado.venceu) {
        athletesMap[key].vitorias += 1;
      } else {
        athletesMap[key].derrotas += 1;
      }
      
      const medalha = resultado.medalha || 'participacao';
      athletesMap[key][medalha] += 1;
    });

    // Convert to array and sort
    let rankedAthletes = Object.values(athletesMap)
      .sort((a, b) => {
        // Sort by medals (gold first)
        if (b.ouro !== a.ouro) return b.ouro - a.ouro;
        if (b.prata !== a.prata) return b.prata - a.prata;
        if (b.bronze !== a.bronze) return b.bronze - a.bronze;
        // Then by win rate
        const rateA = a.vitorias / (a.vitorias + a.derrotas) || 0;
        const rateB = b.vitorias / (b.vitorias + b.derrotas) || 0;
        return rateB - rateA;
      });

    setRankings(rankedAthletes);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-400">{t('carregando') || 'Carregando'}</p>
        </div>
      </div>
    );
  }

  const getMedalColor = (posicao) => {
    if (posicao === 1) return 'text-yellow-400';
    if (posicao === 2) return 'text-gray-300';
    if (posicao === 3) return 'text-orange-600';
    return 'text-gray-400';
  };

  const getMedalEmoji = (posicao) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return '•';
  };

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
          
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <Podium size={36} />
            {t('rankings') || 'Rankings'}
          </h1>
          <p className="text-gray-300">
            {campeonato ? campeonato.nome : t('rankings_gerais') || 'Rankings Gerais'}
          </p>
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

        {/* Filters */}
        {(categorias.length > 1 || modalidades.length > 1) && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorias.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    {t('categoria') || 'Categoria'}
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="todas">{t('todas') || 'Todas'}</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalidades.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    {t('modalidade') || 'Modalidade'}
                  </label>
                  <select
                    value={filtroModalidade}
                    onChange={(e) => setFiltroModalidade(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="todas">{t('todas') || 'Todas'}</option>
                    {modalidades.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rankings Table */}
        {rankings.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">{t('sem_dados') || 'Sem dados disponíveis'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((atleta, idx) => {
              const posicao = idx + 1;
              const taxaVitoria = ((atleta.vitorias / (atleta.vitorias + atleta.derrotas)) * 100).toFixed(1);
              
              return (
                <div 
                  key={atleta.email}
                  className={`rounded-lg p-4 border transition ${
                    posicao === 1 
                      ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border-yellow-600' 
                      : posicao === 2 
                      ? 'bg-gradient-to-r from-gray-700/30 to-gray-600/20 border-gray-500'
                      : posicao === 3
                      ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-orange-600'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Position */}
                    <div className={`text-3xl font-black ${getMedalColor(posicao)} min-w-max`}>
                      <span className="text-5xl">{getMedalEmoji(posicao)}</span>
                      <p className="text-sm">{t('posicao') || 'Pos.'} {posicao}</p>
                    </div>

                    {/* Athlete Name */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{atleta.nome}</h3>
                      <p className="text-sm text-gray-400">{atleta.email}</p>
                    </div>

                    {/* Medals */}
                    <div className="flex gap-4 md:gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-black text-yellow-400">{atleta.ouro}</p>
                        <p className="text-xs text-gray-400 font-bold">🥇 {t('ouro') || 'Ouro'}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-black text-gray-300">{atleta.prata}</p>
                        <p className="text-xs text-gray-400 font-bold">🥈 {t('prata') || 'Prata'}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-black text-orange-600">{atleta.bronze}</p>
                        <p className="text-xs text-gray-400 font-bold">🥉 {t('bronze') || 'Bronze'}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-center md:text-right">
                      <p className="text-sm font-bold">
                        <span className="text-green-400">{atleta.vitorias}V</span>
                        {' - '}
                        <span className="text-red-400">{atleta.derrotas}D</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {t('taxa') || 'Taxa'}: <span className="text-purple-400 font-bold">{taxaVitoria}%</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
