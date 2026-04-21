import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Cadastro } from './pages/Cadastro';
import { Login } from './pages/Login';
import { Perfil } from './pages/Perfil';
import { Configuracoes } from './pages/Configuracoes';
import { AdminDashboard } from './pages/AdminDashboard';
import { Live } from './pages/Live';
import { ArbitroDashboard } from './pages/ArbitroDashboard';
import { MesarioPanel } from './pages/MesarioPanel';
import { LateralPanel } from './pages/LateralPanel';
import { ScoreboardTV } from './pages/ScoreboardTV';
import { ScoreboardTVToken } from './pages/ScoreboardTVToken';
import { Noticias } from './pages/Noticias';
import { AtletaEventoHoje } from './pages/AtletaEventoHoje';
import './i18n'; // Importa a configuração de i18n

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota da página inicial */}
        <Route path="/" element={<Home />} />
        
        {/* Rota da página de cadastro */}
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rota da página de login */}
        <Route path="/login" element={<Login />} />

        {/* Rota da página de perfil */}
        <Route path="/perfil" element={<Perfil />} />

        {/* Rota da página de configurações */}
        <Route path="/configuracoes" element={<Configuracoes />} />

        {/* Rota do painel administrativo */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Rota do painel ao vivo */}
        <Route path="/live/:id" element={<Live />} />

        {/* Rota do painel do árbitro */}
        <Route path="/painel-arbitro" element={<ArbitroDashboard />} />

        {/* Rota do painel do mesário */}
        <Route path="/mesario/:id" element={<MesarioPanel />} />

        {/* Rota do painel lateral */}
        <Route path="/lateral/:id" element={<LateralPanel />} />

        {/* Rota FIXA do Scoreboard TV - Input Token + Polling (deve vir ANTES da dinâmica) */}
        <Route path="/scoreboard" element={<ScoreboardTVToken />} />
        
        {/* Rota do Scoreboard/Placar TV (dinâmica - antiga) */}
        <Route path="/scoreboard/:id/:quadra" element={<ScoreboardTV />} />

        {/* Rota de notícias */}
        <Route path="/noticias" element={<Noticias />} />

        {/* ✅ PHASE 2: Athlete Event Page - My Fights Today */}
        <Route path="/evento-hoje" element={<AtletaEventoHoje />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;