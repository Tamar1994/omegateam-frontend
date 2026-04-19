import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

export function AdminUsuarios() {
  const { t } = useTranslation();

  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 10;

  // Carregar usuários ao montar
  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Volta para página 1 quando digita na busca
  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaUsuario]);

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios`);
      const data = await res.json();
      setUsuariosSistema(data);
    } catch (e) {
      console.error('Erro ao buscar usuários');
      alert('Erro ao carregar usuários');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const alterarRoleUsuario = async (userId, novaRole) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: novaRole })
      });

      if (res.ok) {
        setUsuariosSistema(prev =>
          prev.map(u => (u._id === userId ? { ...u, role: novaRole } : u))
        );
        alert(`Permissão alterada para ${novaRole.toUpperCase()} com sucesso!`);
      }
    } catch (e) {
      alert('Erro ao atualizar permissão.');
    }
  };

  // Filtrar usuários
  const usuariosFiltrados = usuariosSistema.filter(u => {
    const termo = buscaUsuario.toLowerCase();
    const nomeCompleto = `${u.nome} ${u.sobrenome}`.toLowerCase();
    return nomeCompleto.includes(termo) || u.email.toLowerCase().includes(termo);
  });

  // Paginação
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / itensPorPagina) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header com Busca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestão de Usuários</h2>
          <p className="text-sm text-gray-500 mt-1">
            Promova atletas a Árbitros ou Administradores.
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={buscaUsuario}
            onChange={e => setBuscaUsuario(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-omega-red transition-shadow text-sm"
          />
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {loadingUsuarios ? (
          <p className="text-center text-gray-500 py-12">A carregar utilizadores...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wide border-b border-gray-200">
                    <th className="p-4 font-semibold">Utilizador</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Localidade / Equipa</th>
                    <th className="p-4 font-semibold">Graduação</th>
                    <th className="p-4 font-semibold text-center">Nível de Acesso</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {usuariosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                        Nenhum utilizador encontrado.
                      </td>
                    </tr>
                  ) : (
                    usuariosPaginados.map((user, idx) => (
                      <tr key={user._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-4 font-semibold text-gray-800">
                          {user.nome} {user.sobrenome}
                        </td>
                        <td className="p-4 text-gray-600 text-xs">{user.email}</td>
                        <td className="p-4 text-gray-600">
                          {user.equipa || user.localidade || '-'}
                        </td>
                        <td className="p-4 text-gray-600">{user.graduacao || '-'}</td>
                        <td className="p-4 text-center">
                          <select
                            value={user.role}
                            onChange={e => alterarRoleUsuario(user._id, e.target.value)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer outline-none ${
                              user.role === 'admin'
                                ? 'bg-omega-red text-white'
                                : user.role === 'arbitro'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <option value="atleta">Atleta</option>
                            <option value="arbitro">Árbitro</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas} ({usuariosFiltrados.length} utilizadores)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
