import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, UploadCloud } from 'lucide-react';
import { gerarCategoriasFETESP } from '../../utils/categoriasPadrao';
import { API_BASE_URL } from '../../services/api';

export function AdminCampeonatos({ onAbrirGerenciador, onAbrirPainel, onNavigate }) {
  const { t } = useTranslation();

  const [campeonatos, setCampeonatos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivoOficio, setArquivoOficio] = useState(null);
  const [formCamp, setFormCamp] = useState({
    nome: '',
    data_evento: '',
    local: '',
    modalidades: 'Poomsae e Kyorugui',
    status: 'Inscrições Abertas',
    inclui_parataekwondo: false,
    nivel: 'Estadual'
  });

  // Carregar campeonatos ao montar
  useEffect(() => {
    carregarCampeonatos();
  }, []);

  const carregarCampeonatos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campeonatos`);
      const data = await response.json();
      setCampeonatos(data);
    } catch (error) {
      console.error('Erro ao buscar campeonatos', error);
      alert('Erro ao carregar campeonatos');
    }
  };

  const handleCriarCampeonato = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let oficioUrl = '';
      if (arquivoOficio) {
        const formData = new FormData();
        formData.append('arquivo', arquivoOficio);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-oficio`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        oficioUrl = uploadData.url;
      }

      const categoriasIniciais = gerarCategoriasFETESP(
        formCamp.inclui_parataekwondo,
        formCamp.modalidades
      );
      const dadosCompletos = {
        ...formCamp,
        oficio_url: oficioUrl,
        categorias: categoriasIniciais
      };

      const response = await fetch(`${API_BASE_URL}/api/campeonatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCompletos)
      });

      if (response.ok) {
        alert('Campeonato criado com sucesso!');
        setMostrarModal(false);
        setFormCamp({
          nome: '',
          data_evento: '',
          local: '',
          modalidades: 'Poomsae e Kyorugui',
          status: 'Inscrições Abertas',
          inclui_parataekwondo: false,
          nivel: 'Estadual'
        });
        setArquivoOficio(null);
        carregarCampeonatos();
      }
    } catch (error) {
      console.error('Erro ao criar campeonato:', error);
      alert('Erro ao criar o campeonato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Meus Campeonatos</h2>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-omega-red text-white py-2 px-6 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
        >
          + Novo Campeonato
        </button>
      </div>

      {/* Grid de Campeonatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campeonatos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
            Nenhum campeonato cadastrado ainda.
          </div>
        ) : (
          campeonatos.map(camp => (
            <div
              key={camp._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      camp.status === 'Inscrições Abertas'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{camp.nome}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {camp.modalidades}
                  {camp.inclui_parataekwondo && ' + ParaTKD'}
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Data:</strong> {new Date(camp.data_evento).toLocaleDateString('pt-BR')}
                  </p>
                  <p>
                    <strong>Local:</strong> {camp.local}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() => onAbrirGerenciador(camp)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold py-2 rounded-lg transition-colors text-sm border border-blue-200"
                >
                  <Settings size={16} /> Configurar Categorias ({camp.categorias?.length || 0})
                </button>
                <button
                  onClick={() => onAbrirPainel(camp)}
                  className="w-full bg-omega-dark hover:bg-black text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                >
                  Painel do Evento (Chaves/Inscritos)
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl transition-all">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-omega-dark">Criar Campeonato</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCriarCampeonato} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do Evento
                </label>
                <input
                  type="text"
                  required
                  value={formCamp.nome}
                  onChange={e => setFormCamp({ ...formCamp, nome: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-omega-red outline-none transition-shadow"
                  placeholder="Ex: Copa Regional de Taekwondo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formCamp.data_evento}
                    onChange={e => setFormCamp({ ...formCamp, data_evento: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-omega-red outline-none transition-shadow text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nível</label>
                  <select
                    value={formCamp.nivel}
                    onChange={e => setFormCamp({ ...formCamp, nivel: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white transition-shadow text-sm text-gray-700"
                  >
                    <option value="Estadual">Estadual</option>
                    <option value="Nacional">Nacional</option>
                    <option value="Internacional">Internacional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Modalidades</label>
                  <select
                    value={formCamp.modalidades}
                    onChange={e => setFormCamp({ ...formCamp, modalidades: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-omega-red outline-none bg-white transition-shadow text-sm text-gray-700"
                  >
                    <option value="Poomsae e Kyorugui">Ambos</option>
                    <option value="Apenas Kyorugui">Apenas Kyorugui</option>
                    <option value="Apenas Poomsae">Apenas Poomsae</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Local</label>
                  <input
                    type="text"
                    required
                    placeholder="Ginásio ou Endereço"
                    value={formCamp.local}
                    onChange={e => setFormCamp({ ...formCamp, local: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-omega-red outline-none transition-shadow"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formCamp.inclui_parataekwondo}
                  onChange={e => setFormCamp({ ...formCamp, inclui_parataekwondo: e.target.checked })}
                  className="w-5 h-5 accent-omega-red rounded cursor-pointer"
                />
                <span className="font-semibold text-gray-700 text-sm">
                  Incluir Parataekwondo
                </span>
              </label>

              <div className="pt-2">
                <label className="block text-sm font-semibold mb-2 text-omega-red flex items-center gap-1">
                  <UploadCloud size={18} /> Upload do Ofício (Opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setArquivoOficio(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-omega-red hover:file:bg-red-100 cursor-pointer border border-gray-300 p-2 rounded-lg bg-white"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-omega-red text-white py-3.5 rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-red-400 shadow-md"
                >
                  {loading ? 'Criando...' : 'Criar Campeonato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
