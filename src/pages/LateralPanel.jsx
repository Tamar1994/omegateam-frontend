import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, CheckCircle, Clock, Send, MinusCircle, PlusCircle, Smartphone } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function LateralPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [minhaQuadra, setMinhaQuadra] = useState(null);
  const [meuSlot, setMeuSlot] = useState(null); // Ex: "lateral1"
  const [isReady, setIsReady] = useState(false);
  
  const [lutaAtual, setLutaAtual] = useState(null);

  // Estados de Avaliação (Poomsae)
  const [precisao, setPrecisao] = useState(4.0);
  const [apresentacao, setApresentacao] = useState(6.0);
  const [poomsaeEnviado, setPoomsaeEnviado] = useState(false);

  // ==========================================
  // 1. CARREGAMENTO E IDENTIFICAÇÃO DO JUIZ
  // ==========================================
  useEffect(() => {
    const userStr = localStorage.getItem('usuarioOmegaTeam');
    if (userStr) setUsuarioLogado(JSON.parse(userStr));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const carregarQuadra = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/minha-quadra/${usuarioLogado.email}`);
        if (res.ok) {
          const quadra = await res.json();
          setMinhaQuadra(quadra);
          
          // Descobre qual Lateral eu sou
          for (let i = 1; i <= 5; i++) {
            if (quadra[`lateral${i}_email`] === usuarioLogado.email) {
              setMeuSlot(`lateral${i}`);
              setIsReady(quadra[`lateral${i}_ready`]);
              break;
            }
          }
        }
      } catch (e) {
        console.error(t('erro_buscar_quadra'));
      }
    };
    carregarQuadra();
  }, [usuarioLogado, id, t]);

  // ==========================================
  // 2. POLLING DA LUTA ATUAL (A cada 2 segundos)
  // ==========================================
  useEffect(() => {
    if (!isReady || !minhaQuadra) return;
    
    const buscarLuta = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/quadras/${minhaQuadra.numero_quadra}/luta-atual`);
        if (res.ok) {
          const luta = await res.json();
          // Se mudou a luta, reseta o painel de Poomsae
          if (lutaAtual && lutaAtual._id !== luta._id) {
             setPrecisao(4.0);
             setApresentacao(6.0);
             setPoomsaeEnviado(false);
          }
          setLutaAtual(luta);
        } else {
          setLutaAtual(null); // Nenhuma luta ativa
        }
      } catch (e) {
        setLutaAtual(null);
      }
    };

    buscarLuta();
    const intervalo = setInterval(buscarLuta, 2000);
    return () => clearInterval(intervalo);
  }, [isReady, minhaQuadra, id, lutaAtual, t]);

  // ==========================================
  // 3. AÇÕES DO JOYSTICK
  // ==========================================
  const marcarReady = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/campeonatos/${id}/quadras/${minhaQuadra.numero_quadra}/ready`, {
        method: 'PUT', headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lateral_slot: meuSlot, is_ready: true })
      });
      setIsReady(true);
    } catch (e) {
      alert(t('erro_sincronizar'));
    }
  };

  const enviarPontoKyorugui = (cor, pontos) => {
    // Em um sistema real com WebSockets, isso iria direto para a Janela de Coincidência.
    // Como estamos no MVP, vamos dar um feedback visual (vibrar o telemóvel).
    if (navigator.vibrate) navigator.vibrate(50);
    console.log(`Enviado +${pontos} para o ${cor}`);
    
    // Animação visual rápida
    const btn = document.getElementById(`btn-${cor}-${pontos}`);
    if(btn) {
      btn.classList.add('scale-95', 'brightness-150');
      setTimeout(() => btn.classList.remove('scale-95', 'brightness-150'), 150);
    }
  };

  const enviarNotaPoomsae = () => {
    if (window.confirm(t('confirmar_nota_final', { valor: (precisao + apresentacao).toFixed(2) }))) {
      setPoomsaeEnviado(true);
      // Aqui faríamos o POST para o banco de dados salvar a nota deste juiz
      alert(t('nota_enviada_mesa_central'));
    }
  };

  // ==========================================
  // RENDERIZAÇÃO: TELAS
  // ==========================================
  if (!minhaQuadra || !meuSlot) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center">{t('conectando_servidor_quadra')}</div>;
  }

  // TELA 1: CHECK-IN (LOBBY)
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <Smartphone size={80} className="text-blue-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black mb-2 text-center">{t('sincronizar_joystick')}</h1>
        <p className="text-gray-400 text-center mb-12">{t('voce_escalado_como_juiz_lateral', { funcao: meuSlot.replace('lateral', `${t('juiz_lateral')} `) })} {t('quadra_label')} {minhaQuadra.numero_quadra}.</p>
        
        <button onClick={marcarReady} className="w-full max-w-sm bg-green-600 hover:bg-green-500 text-white py-6 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(22,163,74,0.4)] transition-all flex flex-col items-center gap-2">
          <CheckCircle size={32} /> {t('estou_pronto')}
        </button>
      </div>
    );
  }

  // TELA 2: AGUARDANDO LUTA (STANDBY)
  if (!lutaAtual) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
        <Clock size={60} className="text-gray-600 mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold text-gray-500 text-center uppercase tracking-widest">{t('aguardando_mesario')}</h2>
        <p className="text-gray-600 mt-2 text-center">{t('tela_ativada_automaticamente')}</p>
      </div>
    );
  }

  // TELA 3: JOYSTICK POOMSAE
  if (lutaAtual.modalidade === 'Poomsae') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col select-none touch-manipulation">
        <header className="bg-slate-950 p-4 border-b border-slate-800 text-center">
          <p className="text-blue-400 font-bold uppercase text-sm mb-1">{t('juiz_lateral_numero_quadra', { numero: meuSlot.replace('lateral', ''), quadra: minhaQuadra.numero_quadra })}</p>
          <h1 className="text-xl font-black truncate">{lutaAtual.atleta?.split(' (')[0] || t('apresentacao_poomsae')}</h1>
        </header>

        {poomsaeEnviado ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h2 className="text-3xl font-black text-white mb-2">{t('nota_registrada')}</h2>
            <p className="text-slate-400">{t('aguarde_proxima_apresentacao')}</p>
          </div>
        ) : (
          <main className="flex-1 p-4 flex flex-col gap-6">
            
            {/* Bloco de Precisão (Deduções) */}
            <div className="bg-slate-800 rounded-2xl p-6 border-2 border-slate-700 shadow-xl flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{t('precisao')} (4.0)</span>
                <span className="text-4xl font-black text-red-400">{precisao.toFixed(1)}</span>
              </div>
              <div className="flex gap-4 flex-1">
                <button onClick={() => setPrecisao(p => Math.max(0, p - 0.3))} className="flex-1 bg-red-900/30 border-2 border-red-800 rounded-xl flex flex-col items-center justify-center text-red-400 active:bg-red-900/60 transition-colors">
                  <MinusCircle size={32} className="mb-2"/> <span className="font-black text-2xl">-0.3</span> <span className="text-xs font-bold uppercase mt-1">{t('erro_maior')}</span>
                </button>
                <button onClick={() => setPrecisao(p => Math.max(0, p - 0.1))} className="flex-1 bg-orange-900/30 border-2 border-orange-800 rounded-xl flex flex-col items-center justify-center text-orange-400 active:bg-orange-900/60 transition-colors">
                  <MinusCircle size={32} className="mb-2"/> <span className="font-black text-2xl">-0.1</span> <span className="text-xs font-bold uppercase mt-1">{t('erro_menor')}</span>
                </button>
              </div>
            </div>

            {/* Bloco de Apresentação */}
            <div className="bg-slate-800 rounded-2xl p-6 border-2 border-slate-700 shadow-xl flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{t('apresentacao')} (6.0)</span>
                <span className="text-4xl font-black text-blue-400">{apresentacao.toFixed(1)}</span>
              </div>
              <div className="flex gap-4 flex-1">
                <button onClick={() => setApresentacao(p => Math.max(0, p - 0.1))} className="flex-1 bg-slate-700 border-2 border-slate-600 rounded-xl flex items-center justify-center text-slate-300 active:bg-slate-600 transition-colors">
                  <MinusCircle size={40} />
                </button>
                <button onClick={() => setApresentacao(p => Math.min(6.0, p + 0.1))} className="flex-1 bg-blue-900/30 border-2 border-blue-800 rounded-xl flex items-center justify-center text-blue-400 active:bg-blue-900/60 transition-colors">
                  <PlusCircle size={40} />
                </button>
              </div>
            </div>

            {/* Submeter Nota */}
            <button onClick={enviarNotaPoomsae} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform">
              {t('enviar_nota', { valor: (precisao + apresentacao).toFixed(1) })} <Send size={24} />
            </button>
          </main>
        )}
      </div>
    );
  }

  // TELA 4: JOYSTICK KYORUGUI (LUTA)
  return (
    <div className="min-h-screen bg-black font-sans flex flex-col select-none touch-manipulation overflow-hidden">
      <header className="bg-gray-900 p-2 text-center border-b border-gray-800 flex justify-between items-center px-4">
        <span className="text-gray-500 font-bold uppercase text-xs">Quadra {minhaQuadra.numero_quadra}</span>
        <span className="text-gray-300 font-black text-sm uppercase">{meuSlot.replace('lateral', 'Lateral ')}</span>
      </header>
      
      {/* OS DOIS LADOS DO COMANDO */}
      <main className="flex-1 flex">
        
        {/* COMANDO VERMELHO */}
        <div className="flex-1 bg-red-900 border-r-4 border-black flex flex-col p-2 gap-2">
          <button id="btn-red-3" onClick={() => enviarPontoKyorugui('red', 3)} className="flex-1 bg-red-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-red-200 font-bold text-sm uppercase mb-1">Cabeça</span>
            <span className="text-white font-black text-5xl">+3</span>
          </button>
          <button id="btn-red-2" onClick={() => enviarPontoKyorugui('red', 2)} className="flex-1 bg-red-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-red-200 font-bold text-sm uppercase mb-1">Tronco Giro</span>
            <span className="text-white font-black text-5xl">+2</span>
          </button>
          <button id="btn-red-1" onClick={() => enviarPontoKyorugui('red', 1)} className="flex-1 bg-red-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-red-200 font-bold text-sm uppercase mb-1">Soco</span>
            <span className="text-white font-black text-5xl">+1</span>
          </button>
        </div>

        {/* COMANDO AZUL */}
        <div className="flex-1 bg-blue-900 flex flex-col p-2 gap-2">
          <button id="btn-blue-3" onClick={() => enviarPontoKyorugui('blue', 3)} className="flex-1 bg-blue-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-blue-200 font-bold text-sm uppercase mb-1">Cabeça</span>
            <span className="text-white font-black text-5xl">+3</span>
          </button>
          <button id="btn-blue-2" onClick={() => enviarPontoKyorugui('blue', 2)} className="flex-1 bg-blue-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-blue-200 font-bold text-sm uppercase mb-1">Tronco Giro</span>
            <span className="text-white font-black text-5xl">+2</span>
          </button>
          <button id="btn-blue-1" onClick={() => enviarPontoKyorugui('blue', 1)} className="flex-1 bg-blue-600 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all">
            <span className="text-blue-200 font-bold text-sm uppercase mb-1">Soco</span>
            <span className="text-white font-black text-5xl">+1</span>
          </button>
        </div>

      </main>
    </div>
  );
}

export default LateralPanel;