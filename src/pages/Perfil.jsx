import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, UploadCloud, X, Save } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { API_BASE_URL } from '../services/api';

export function Perfil() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({});
  const [savingForm, setSavingForm] = useState(false);
  
  // Estados do Recorte de Foto
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingFoto, setLoadingFoto] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioOmegaTeam');
    if (!usuarioSalvo) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(usuarioSalvo);
      setUsuario(parsedUser);
      setFormData(parsedUser); // Preenche o formulário com os dados do usuário
    }
  }, [navigate]);

  // Função para controlar a digitação nos inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- FUNÇÕES DA FOTO ---
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setFotoSelecionada(imageDataUrl);
      setIsModalOpen(true);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const criarImagemCortada = async () => {
    try {
      const croppedImage = await getCroppedImg(fotoSelecionada, croppedAreaPixels);
      await enviarParaBackend(croppedImage);
    } catch (e) {
      console.error("Erro detalhado:", e);
      alert(t('erro_recortar'));
    }
  };

  const enviarParaBackend = async (blobFile) => {
    setLoadingFoto(true);
    const formDado = new FormData();
    formDado.append("email", usuario.email);
    formDado.append("foto", blobFile, "perfil.jpg");

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-foto`, {
        method: "POST",
        body: formDado,
      });
      const data = await response.json();
      if (response.ok) {
        const usuarioAtualizado = { ...usuario, foto: data.url_foto };
        localStorage.setItem('usuarioOmegaTeam', JSON.stringify(usuarioAtualizado));
        setUsuario(usuarioAtualizado);
        setIsModalOpen(false);
        alert(t('foto_atualizada'));
      }
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert(t('erro_enviar_foto'));
    } finally {
      setLoadingFoto(false);
    }
  };

  // --- FUNÇÃO PARA SALVAR OS DADOS DE TEXTO ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingForm(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/atualizar-perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          peso: parseFloat(formData.peso),
          altura: parseFloat(formData.altura)
        })
      });

      if (response.ok) {
        // Atualiza a sessão para manter os dados quando recarregar
        const usuarioAtualizado = { ...usuario, ...formData };
        localStorage.setItem('usuarioOmegaTeam', JSON.stringify(usuarioAtualizado));
        setUsuario(usuarioAtualizado);
        alert("Perfil atualizado com sucesso!");
      } else {
        alert("Erro ao atualizar o perfil.");
      }
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSavingForm(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Botão Voltar */}
      <div className="w-full max-w-4xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-omega-red transition-colors font-medium">
          <ArrowLeft size={20} /> {t('voltar')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-12">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 w-full max-w-4xl">
          
          <h2 className="text-2xl font-bold text-omega-dark mb-8 border-b pb-4">{t('meu_perfil')}</h2>

          {/* Área da Foto */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <img 
                src={usuario.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usuario.nome}`} 
                alt="Perfil" 
                className="w-32 h-32 rounded-full border-4 border-gray-100 object-cover shadow-sm bg-white"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">{t('clique_foto_alterar')}</p>
          </div>

          {/* FORMULÁRIO COMPLETO */}
          <form className="space-y-6" onSubmit={handleSaveProfile}>
            
            {/* Campos Bloqueados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('email')}</label>
                <input type="email" value={formData.email || ''} disabled className="w-full border border-gray-200 p-3 rounded-lg bg-gray-100 text-gray-500 outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('cpf_passaporte')}</label>
                <input type="text" value={formData.cpf_passaporte || ''} disabled className="w-full border border-gray-200 p-3 rounded-lg bg-gray-100 text-gray-500 outline-none mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('nome')}</label>
                <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('sobrenome')}</label>
                <input type="text" name="sobrenome" value={formData.sobrenome || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('sexo')}</label>
                <select name="sexo" value={formData.sexo || 'M'} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white mt-1">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('nascimento')}</label>
                <input type="date" name="nascimento" value={formData.nascimento || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('peso')}</label>
                <input type="number" step="0.1" name="peso" value={formData.peso || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('altura')}</label>
                <input type="number" step="0.01" name="altura" value={formData.altura || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('graduacao')}</label>
                <select name="graduacao" value={formData.graduacao || ''} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white mt-1">
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
                <label className="block text-sm font-medium text-gray-700">{t('registro_federacao')}</label>
                <input type="text" name="registro_federacao" value={formData.registro_federacao || ''} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('registro_cbtkd')}</label>
                <input type="text" name="registro_cbtkd" value={formData.registro_cbtkd || ''} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('registro_kukkiwon')}</label>
                <input type="text" name="registro_kukkiwon" value={formData.registro_kukkiwon || ''} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
            </div>
            {/* Bloco de Equipe e Região */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-gray-100 pt-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipe</label>
                <input type="text" name="equipe" value={formData.equipe || ''} onChange={handleChange} placeholder="Ex: Omega Team" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado (Sigla)</label>
                <input type="text" name="estado" maxLength="2" value={formData.estado || ''} onChange={handleChange} placeholder="Ex: SP" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">País (Sigla)</label>
                <input type="text" name="pais" maxLength="3" value={formData.pais || ''} onChange={handleChange} placeholder="Ex: BRA" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-omega-red outline-none mt-1 uppercase" />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={savingForm} className="w-full md:w-auto bg-omega-dark text-white py-3 px-8 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors disabled:bg-gray-400">
                {savingForm ? t('aguarde') : <><Save size={20}/> {t('salvar_alteracoes')}</>}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Modal de Crop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-bold text-lg">{t('ajustar_foto')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="relative h-80 w-full bg-gray-900">
              <Cropper image={fotoSelecionada} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-4 bg-gray-50">
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full mb-4 accent-omega-red" />
              <button onClick={criarImagemCortada} disabled={loadingFoto} className="w-full bg-omega-red text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-red-700 transition-colors disabled:bg-red-400">
                {loadingFoto ? t('aguarde') : <><UploadCloud size={20} /> {t('confirmar_corte')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Funções Auxiliares (mantidas idênticas ao código anterior)
function readFile(file) { return new Promise((resolve) => { const reader = new FileReader(); reader.addEventListener('load', () => resolve(reader.result), false); reader.readAsDataURL(file); }); }
async function getCroppedImg(imageSrc, pixelCrop) { const image = new Image(); image.src = imageSrc; await new Promise((resolve) => (image.onload = resolve)); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 400; canvas.height = 400; ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 400, 400); return new Promise((resolve, reject) => { canvas.toBlob((blob) => { if (!blob) { reject(new Error('Canvas vazio')); return; } resolve(blob); }, 'image/jpeg', 0.9); }); }