import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, ArrowLeft } from 'lucide-react';
import omegaLogo from '../assets/omega-logo.png';
import { AdminCampeonatos } from '../components/admin/AdminCampeonatos';
import { AdminCategorias } from '../components/admin/AdminCategorias';
import { AdminEvento } from '../components/admin/AdminEvento';
import { AdminUsuarios } from '../components/admin/AdminUsuarios';

export function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('campeonatos');
  const [campeonatoEditando, setCampeonatoEditando] = useState(null);
  const [eventoAtivo, setEventoAtivo] = useState(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (usuarioSalvo) {
      const parsedUser = JSON.parse(usuarioSalvo);
      if (parsedUser.role !== 'admin') {
        navigate('/');
      } else {
        setUsuario(parsedUser);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleAbrirGerenciador = (camp) => {
    setCampeonatoEditando(camp);
    setEventoAtivo(null);
  };

  const handleAbrirPainel = (camp) => {
    setEventoAtivo(camp);
    setCampeonatoEditando(null);
  };

  const handleVoltar = () => {
    setCampeonatoEditando(null);
    setEventoAtivo(null);
  };

  if (!usuario) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-omega-dark text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex items-center gap-3">
          <img src={omegaLogo} alt="Omega Team" className="w-12 h-12 rounded-lg" />
          <div>
            <h1 className="font-black text-lg">Omega Team</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setAbaAtiva('campeonatos'); handleVoltar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              abaAtiva === 'campeonatos' && !campeonatoEditando && !eventoAtivo ? 'bg-omega-red text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Trophy size={20} /> Campeonatos
          </button>
          <button
            onClick={() => { setAbaAtiva('usuarios'); handleVoltar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              abaAtiva === 'usuarios' ? 'bg-omega-red text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Users size={20} /> Gestão de Usuários
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center mb-2">Logado como:</p>
          <p className="text-sm font-bold text-center">{usuario.nome}</p>
          <button
            onClick={() => {
              localStorage.removeItem('usuarioOmegaTeam');
              navigate('/login');
            }}
            className="w-full mt-4 px-4 py-2 bg-omega-red hover:bg-red-700 rounded-lg text-xs font-bold transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            {(campeonatoEditando || eventoAtivo) && (
              <button
                onClick={handleVoltar}
                className="text-gray-500 hover:text-omega-red flex items-center gap-2 text-sm font-bold mb-2 transition-colors"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            <h2 className="text-2xl font-black text-omega-dark">
              {campeonatoEditando ? `Categorias: ${campeonatoEditando.nome}` : eventoAtivo ? `Painel do Evento: ${eventoAtivo.nome}` : abaAtiva === 'campeonatos' ? 'Gestão de Campeonatos' : 'Gestão de Usuários'}
            </h2>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </header>

        <div className="p-8">
          {abaAtiva === 'campeonatos' && !campeonatoEditando && !eventoAtivo && (
            <AdminCampeonatos onAbrirGerenciador={handleAbrirGerenciador} onAbrirPainel={handleAbrirPainel} onNavigate={setAbaAtiva} />
          )}
          {campeonatoEditando && <AdminCategorias campeonato={campeonatoEditando} onVoltar={handleVoltar} />}
          {eventoAtivo && <AdminEvento evento={eventoAtivo} onVoltar={handleVoltar} />}
          {abaAtiva === 'usuarios' && <AdminUsuarios />}
        </div>
      </main>
    </div>
  );
}

