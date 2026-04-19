import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeBanner } from '../components/home/HomeBanner';
import { CampeonatosList } from '../components/home/CampeonatosList';
import { CampeonatoModal } from '../components/home/CampeonatoModal';
import { MuralNoticias } from '../components/home/MuralNoticias';
import { API_BASE_URL } from '../services/api';

export function Home() {
  const { t } = useTranslation();

  // ==========================================
  // ESTADOS DO COMPONENTE
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [campeonatosAtivos, setCampeonatosAtivos] = useState([]);
  const [campSelecionado, setCampSelecionado] = useState(null);

  // ==========================================
  // EFEITOS (USE EFFECT)
  // ==========================================
  
  // 1. Busca o usuário logado
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
      setIsLoggedIn(true);
    }
  }, []);

  // 2. Busca os campeonatos criados pelo Admin
  useEffect(() => {
    const buscarCampeonatos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/campeonatos`);
        const data = await response.json();
        setCampeonatosAtivos(data.filter(c => c.status === "Inscrições Abertas"));
      } catch (error) { 
        console.error("Erro ao buscar campeonatos", error); 
      }
    };
    buscarCampeonatos();
  }, []);

  // ==========================================
  // FUNÇÕES DE AÇÃO
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem('usuarioOmegaTeam');
    setIsLoggedIn(false);
    setUsuario(null);
  };

  const abrirCampeonato = (camp) => {
    setCampSelecionado(camp);
  };

  const fecharCampeonato = () => {
    setCampSelecionado(null);
  };    

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50">
      
      {/* Header */}
      <HomeBanner 
        usuario={usuario} 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Seção Principal - Lista de Campeonatos */}
        <section className="flex-2 w-full lg:w-2/3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-omega-dark">{t('proximos_eventos')}</h2>
          </div>
          
          <CampeonatosList 
            campeonatos={campeonatosAtivos} 
            onSelectCampeonato={abrirCampeonato}
          />
        </section>

        {/* Sidebar - Mural de Notícias */}
        {isLoggedIn && (
          <aside className="flex-1 w-full lg:w-1/3">
            <MuralNoticias />
          </aside>
        )}
      </main>

      {/* Modal de Inscrição */}
      {campSelecionado && (
        <CampeonatoModal 
          campeonato={campSelecionado} 
          usuario={usuario} 
          onClose={fecharCampeonato}
        />
      )}
    </div>
  );
}

export default Home;