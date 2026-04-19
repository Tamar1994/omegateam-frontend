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

        {/* Rota do Scoreboard/Placar TV */}
        <Route path="/scoreboard/:id/:quadra" element={<ScoreboardTV />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;