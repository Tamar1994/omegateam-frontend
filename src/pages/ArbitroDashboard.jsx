import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, MapPin, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { API_BASE_URL } from '../services/api';

export function ArbitroDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [campeonatos, setCampeonatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entrandoCampId, setEntrandoCampId] = useState(null); // Controla o loading do botão

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (usuarioSalvo) {
      const parsedUser = JSON.parse(usuarioSalvo);
      if (parsedUser.role !== 'admin' && parsedUser.role !== 'arbitro') {
        navigate('/'); 
      } else {
        setUsuario(parsedUser);
      }
    } else {
      navigate('/login'); 
    }
  }, [navigate]);

  useEffect(() => {
    if (usuario) {
      const buscarCampeonatos = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/arbitro/${usuario.email}/campeonatos`);
          setCampeonatos(await res.json());
        } catch (e) {
          console.error("Erro ao buscar convocações.");
        } finally {
          setLoading(false);
        }
      };
      buscarCampeonatos();
    }
  }, [usuario]);

  // ==========================================
  // ROTEAMENTO INTELIGENTE (MESÁRIO OU LATERAL)
  // ==========================================
  const entrarNaSessao = async (campId) => {
    setEntrandoCampId(campId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${campId}/minha-quadra/${usuario.email}`);
      if (res.ok) {
        const quadra = await res.json();
        
        // Verifica a função e manda para a rota correta!
        if (quadra.minha_funcao === 'Mesário') {
          navigate(`/mesario/${campId}`);
        } else if (quadra.minha_funcao.includes('Lateral')) {
          navigate(`/lateral/${campId}`);
        } else {
          alert(`Você está escalado como: ${quadra.minha_funcao}. O painel para esta função específica será liberado em breve.`);
          setEntrandoCampId(null);
        }
      } else {
        alert("Erro: Você não parece estar escalado nesta quadra.");
        setEntrandoCampId(null);
      }
    } catch (e) {
      alert("Erro ao verificar sua função no servidor.");
      setEntrandoCampId(null);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      {/* CABEÇALHO DO ÁRBITRO */}
      <header className="bg-slate-950 py-4 px-8 border-b border-slate-800 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <img src={omegaLogo} alt="Omega Team" className="h-12 bg-white rounded p-1" />
          <div>
            <h1 className="text-2xl font-black text-blue-400 uppercase tracking-widest">Painel de Arbitragem</h1>
            <p className="text-slate-400 text-sm">Bem-vindo, {usuario.nome}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-bold transition-colors">
          Voltar ao Site
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Minhas Convocações</h2>
          <p className="text-slate-400 mt-2">Selecione o campeonato abaixo para sincronizar o seu painel de controle ou joystick com a mesa central.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold text-xl animate-pulse">Buscando convocações ativas...</div>
        ) : campeonatos.length === 0 ? (
          <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-12 text-center flex flex-col items-center">
            <ShieldAlert size={60} className="text-slate-500 mb-4" />
            <h3 className="text-2xl font-bold text-slate-300 mb-2">Nenhuma convocação encontrada.</h3>
            <p className="text-slate-500 max-w-md">Você ainda não foi escalado para nenhuma quadra pelos administradores. Aguarde o coordenador configurar o evento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campeonatos.map(camp => (
              <div key={camp._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500 transition-colors shadow-lg flex flex-col">
                <div className="mb-4">
                  <span className="bg-blue-900 text-blue-200 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Equipe Escalada
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-white mb-4 leading-tight">{camp.nome}</h3>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <Calendar size={18} className="text-blue-400" /> 
                    <span>{new Date(camp.data_evento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <MapPin size={18} className="text-blue-400" /> 
                    <span className="truncate">{camp.local}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-700">
                  <button 
                    onClick={() => entrarNaSessao(camp._id)} 
                    disabled={entrandoCampId === camp._id}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MonitorPlay size={20} /> 
                    {entrandoCampId === camp._id ? 'Sincronizando...' : 'Iniciar Sessão'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ArbitroDashboard;
