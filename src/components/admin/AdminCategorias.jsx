import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../../services/api';

export function AdminCategorias({ campeonato, onVoltar }) {
  const { t } = useTranslation();

  const [filtroModalidade, setFiltroModalidade] = useState('Kyorugui');
  const [categoriasTemp, setCategoriasTemp] = useState([]);
  const [loading, setLoading] = useState(false);

  // Inicializar categorias ao abrir
  useEffect(() => {
    if (campeonato) {
      setCategoriasTemp([...campeonato.categorias]);
      if (campeonato.modalidades.includes('Kyorugui')) {
        setFiltroModalidade('Kyorugui');
      } else if (campeonato.modalidades.includes('Poomsae')) {
        setFiltroModalidade('Poomsae');
      }
    }
  }, [campeonato]);

  const salvarCategorias = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/campeonatos/${campeonato._id}/categorias`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categorias: categoriasTemp })
        }
      );
      if (response.ok) {
        alert('Grade de categorias salva com sucesso!');
        onVoltar();
      }
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
      alert('Erro ao salvar categorias.');
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoriaManual = () => {
    setCategoriasTemp([
      {
        id: uuidv4(),
        modalidade: filtroModalidade,
        idade_genero: '',
        graduacao: '',
        peso_ou_tipo: '',
        pesagem: false
      },
      ...categoriasTemp
    ]);
  };

  const atualizarCategoria = (id, campo, valor) => {
    setCategoriasTemp(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, [campo]: valor } : cat
      )
    );
  };

  const excluirCategoria = (id) => {
    setCategoriasTemp(prev => prev.filter(cat => cat.id !== id));
  };

  if (!campeonato) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[80vh]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-2xl font-bold text-omega-dark">Gerenciador de Categorias</h2>
          <p className="text-gray-600 text-sm mt-1">{campeonato.nome}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onVoltar}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={salvarCategorias}
            disabled={loading}
            className="px-6 py-2 bg-omega-red text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition-colors disabled:bg-red-400"
          >
            {loading ? 'Salvando...' : 'Salvar Tabela'}
          </button>
        </div>
      </div>

      {/* Abas de Modalidade */}
      <div className="flex border-b border-gray-200 px-6 pt-4 gap-6 bg-white">
        {['Kyorugui', 'Poomsae', 'Parataekwondo'].map(mod => (
          <button
            key={mod}
            onClick={() => setFiltroModalidade(mod)}
            className={`pb-3 font-bold text-sm border-b-4 transition-colors ${
              filtroModalidade === mod
                ? 'border-omega-red text-omega-red'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700">Categorias de {filtroModalidade}</h3>
          <button
            onClick={adicionarCategoriaManual}
            className="bg-gray-800 text-white px-4 py-2 rounded shadow text-sm font-bold hover:bg-black transition-colors"
          >
            + Adicionar Categoria Vazia
          </button>
        </div>

        <div className="space-y-2">
          {/* Header da Tabela */}
          <div className="flex gap-2 px-4 py-2 bg-gray-200 rounded-lg text-xs font-bold text-gray-600 uppercase tracking-wide">
            <div className="w-1/4">Divisão (Idade/Sexo)</div>
            <div className="w-1/4">Graduação</div>
            <div className="w-1/4">Peso / Tipo</div>
            <div className="w-20 text-center">Pesagem?</div>
            <div className="w-10"></div>
          </div>

          {/* Linhas */}
          {categoriasTemp.filter(c => c.modalidade === filtroModalidade).length === 0 ? (
            <p className="text-center text-gray-400 py-8 italic">
              Nenhuma categoria configurada para {filtroModalidade}.
            </p>
          ) : (
            categoriasTemp.map((cat, index) => {
              if (cat.modalidade !== filtroModalidade) return null;
              return (
                <div
                  key={cat.id}
                  className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200 items-center shadow-sm hover:border-blue-300 transition-colors"
                >
                  <input
                    type="text"
                    value={cat.idade_genero}
                    placeholder="Ex: Cadete Masc"
                    onChange={e =>
                      atualizarCategoria(cat.id, 'idade_genero', e.target.value)
                    }
                    className="w-1/4 border-none bg-gray-50 p-2 rounded outline-none text-sm font-medium focus:bg-blue-50"
                  />

                  <input
                    type="text"
                    value={cat.graduacao}
                    placeholder="Ex: Preta (1º Dan+)"
                    onChange={e =>
                      atualizarCategoria(cat.id, 'graduacao', e.target.value)
                    }
                    className="w-1/4 border-none bg-gray-50 p-2 rounded outline-none text-sm focus:bg-blue-50"
                  />

                  <input
                    type="text"
                    value={cat.peso_ou_tipo}
                    placeholder="Ex: Até 37 kg"
                    onChange={e =>
                      atualizarCategoria(cat.id, 'peso_ou_tipo', e.target.value)
                    }
                    className="w-1/4 border-none bg-gray-50 p-2 rounded outline-none text-sm focus:bg-blue-50"
                  />

                  <div className="w-20 flex justify-center">
                    <input
                      type="checkbox"
                      checked={cat.pesagem}
                      onChange={e =>
                        atualizarCategoria(cat.id, 'pesagem', e.target.checked)
                      }
                      className="w-5 h-5 accent-omega-red cursor-pointer rounded"
                    />
                  </div>

                  <div className="w-10 flex justify-center">
                    <button
                      onClick={() => excluirCategoria(cat.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Excluir Categoria"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
