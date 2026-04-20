import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../../services/api';

export function AdminEvento({ evento, onVoltar }) {
  const { t } = useTranslation();

  const [abaPainel, setAbaPainel] = useState('inscritos');
  const [inscricoesEvento, setInscricoesEvento] = useState([]);
  const [listaArbitros, setListaArbitros] = useState([]);
  const [equipesQuadras, setEquipesQuadras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configCronograma, setConfigCronograma] = useState({
    num_quadras: 2,
    isolar_poomsae: true,
    horario_inicio: '08:30'
  });

  // Carregar dados ao abrir painel
  useEffect(() => {
    if (evento) {
      carregarDadosEvento();
    }
  }, [evento]);

  const carregarDadosEvento = async () => {
    setLoading(true);
    try {
      const [inscrResponse, arbResponse, quadResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/campeonatos/${evento._id}/inscricoes`),
        fetch(`${API_BASE_URL}/api/usuarios/arbitros`),
        fetch(`${API_BASE_URL}/api/campeonatos/${evento._id}/quadras`)
      ]);

      setInscricoesEvento(await inscrResponse.json());
      setListaArbitros(await arbResponse.json());
      setEquipesQuadras(await quadResponse.json());
    } catch (error) {
      console.error(t('erro_buscar_painel_evento'));
    } finally {
      setLoading(false);
    }
  };

  const alterarStatusInscricao = async (inscricaoId, novoStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inscricoes/${inscricaoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_pagamento: novoStatus })
      });

      if (response.ok) {
        setInscricoesEvento(prev =>
          prev.map(insc =>
            insc._id === inscricaoId ? { ...insc, status_pagamento: novoStatus } : insc
          )
        );
      }
    } catch (error) {
      console.error(t('erro_atualizar_status'), error);
      alert(t('erro_atualizar_o_status'));
    }
  };

  const atualizarMembroQuadra = (numeroQuadra, campo, email) => {
    setEquipesQuadras(prev => {
      const existe = prev.find(q => q.numero_quadra === numeroQuadra);
      if (existe) {
        return prev.map(q =>
          q.numero_quadra === numeroQuadra ? { ...q, [campo]: email } : q
        );
      } else {
        return [
          ...prev,
          {
            numero_quadra: numeroQuadra,
            mesario_email: '',
            central_email: '',
            lateral1_email: '',
            lateral2_email: '',
            lateral3_email: '',
            lateral4_email: '',
            lateral5_email: '',
            [campo]: email
          }
        ];
      }
    });
  };

  const salvarEquipeQuadra = async (numeroQuadra) => {
    const equipe = equipesQuadras.find(q => q.numero_quadra === numeroQuadra) || {
      numero_quadra: numeroQuadra,
      mesario_email: '',
      central_email: '',
      lateral1_email: '',
      lateral2_email: '',
      lateral3_email: '',
      lateral4_email: '',
      lateral5_email: ''
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${evento._id}/quadras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipe)
      });
      if (res.ok) {
        alert(t('equipa_quadra_guardada', { numero: numeroQuadra }));
      }
    } catch (e) {
      alert(t('erro_guardar_equipa'));
    }
  };

  const handleGerarCronograma = async () => {
    if (
      !window.confirm(
        t('confirmar_gerar_cronograma')
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/campeonatos/${evento._id}/gerar-cronograma`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configCronograma)
        }
      );
      const data = await res.json();

      if (res.ok) {
        alert(t('cronograma_gerado'));

        const lutasKyorugui = data.lutas.filter(l => l.modalidade === 'Kyorugui');
        const lutasPoomsae = data.lutas.filter(l => l.modalidade === 'Poomsae');

        if (lutasKyorugui.length > 0) gerarPDF(lutasKyorugui, 'Kyorugui');
        if (lutasPoomsae.length > 0) gerarPDF(lutasPoomsae, 'Poomsae');

        await carregarDadosEvento();
      } else {
        alert(data.detail);
      }
    } catch (e) {
      alert('Erro ao gerar cronograma.');
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = (lutas, modalidade) => {
    try {
      if (lutas.length === 0) return;

      const doc = new jsPDF({
        orientation: modalidade === 'Kyorugui' ? 'landscape' : 'portrait'
      });

      if (modalidade === 'Poomsae') {
        doc.setFontSize(18);
        doc.text(
          `Ordem de Apresentação Oficial - ${evento.nome}`,
          14,
          22
        );
        doc.setFontSize(12);
        doc.text(
          `Modalidade: ${modalidade} | Gerado em: ${new Date().toLocaleString('pt-BR')}`,
          14,
          30
        );

        const tableColumn = ['Nº Chamada', 'Local/Hora', 'Categoria', 'Ordem', 'Atleta'];
        const tableRows = lutas.map(luta => [
          luta.ordem_luta,
          `Quadra ${luta.quadra || '-'} | ${luta.horario_previsto || '-'}`,
          getNomeCategoria(luta.categoria_id),
          `${luta.ordem_apresentacao}º`,
          luta.atleta
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] }
        });

        doc.save(`Ordem_${modalidade}_${evento.nome.replace(/\s+/g, '_')}.pdf`);
      } else {
        // Kyorugui - gerar chaves visuais
        const categorias = {};
        lutas.forEach(luta => {
          if (!categorias[luta.categoria_id]) categorias[luta.categoria_id] = [];
          categorias[luta.categoria_id].push(luta);
        });

        let isFirstPage = true;

        Object.keys(categorias).forEach(catId => {
          if (!isFirstPage) doc.addPage();
          isFirstPage = false;

          const chavesCat = categorias[catId];
          const nomeCategoria = getNomeCategoria(catId);

          doc.setFontSize(18);
          doc.setTextColor(220, 38, 38);
          doc.text(`Chave Oficial de Luta - ${evento.nome}`, 14, 20);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          doc.text(`Categoria: ${nomeCategoria}`, 14, 28);
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Modalidade: Kyorugui | Gerado em: ${new Date().toLocaleString('pt-BR')}`,
            14,
            34
          );

          // Simples representação de chave
          doc.setFontSize(8);
          doc.text('Representação simplificada da chave', 14, 45);
          let yPos = 55;
          chavesCat.slice(0, 10).forEach(luta => {
            doc.text(`Luta ${luta.ordem_luta}: ${luta.atleta_vermelho} vs ${luta.atleta_azul}`, 14, yPos);
            yPos += 8;
          });
        });

        doc.save(`Chaves_Luta_${evento.nome.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o PDF.');
    }
  };

  const getNomeCategoria = (idCategoria) => {
    if (!evento) return 'Desconhecida';
    const cat = evento.categorias.find(c => c.id === idCategoria);
    return cat ? `${cat.idade_genero} | ${cat.peso_ou_tipo}` : 'Desconhecida';
  };

  if (!evento) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 rounded-t-xl gap-4">
        <div>
          <button
            onClick={onVoltar}
            className="text-gray-500 hover:text-omega-red flex items-center gap-1 text-sm font-bold mb-2 transition-colors"
          >
            <ArrowLeft size={16} /> {t('voltar_campeonatos')}
          </button>
          <h2 className="text-2xl font-bold text-omega-dark">{evento.nome}</h2>
          <p className="text-gray-600 text-sm mt-1">
            {new Date(evento.data_evento).toLocaleDateString('pt-BR')} - {evento.local}
          </p>
        </div>

        {/* Configuração de Cronograma */}
        <div className="w-full md:w-auto flex flex-col gap-3 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-300 shadow-md">
          <p className="text-sm font-black text-blue-800 uppercase tracking-wider">
            📋 {t('configurar_cronograma')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <label className="flex flex-col text-xs font-semibold text-gray-700">
              {t('quantidade_quadras')}:
              <input
                type="number"
                min="1"
                max="10"
                value={configCronograma.num_quadras}
                onChange={e =>
                  setConfigCronograma({
                    ...configCronograma,
                    num_quadras: parseInt(e.target.value)
                  })
                }
                className="border-2 border-blue-300 p-2 rounded outline-none w-full text-center mt-1 font-bold"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-gray-700">
              {t('horario_inicio')}:
              <input
                type="time"
                value={configCronograma.horario_inicio}
                onChange={e =>
                  setConfigCronograma({
                    ...configCronograma,
                    horario_inicio: e.target.value
                  })
                }
                className="border-2 border-blue-300 p-2 rounded outline-none mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer col-span-2 md:col-span-1">
              <input
                type="checkbox"
                checked={configCronograma.isolar_poomsae}
                onChange={e =>
                  setConfigCronograma({
                    ...configCronograma,
                    isolar_poomsae: e.target.checked
                  })
                }
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-xs">Isolar Poomsae</span>
            </label>
            <button
              onClick={handleGerarCronograma}
              disabled={loading}
              className="col-span-2 md:col-span-1 px-6 py-2 bg-gradient-to-r from-omega-red to-red-700 text-white font-black rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {loading ? t('gerando') : '🎲 ' + t('gerar_cronograma')}
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white border-b border-gray-100">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
          <p className="text-blue-600 text-sm font-bold uppercase">{t('total_inscricoes')}</p>
          <p className="text-3xl font-black text-blue-900">{inscricoesEvento.length}</p>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
          <p className="text-green-600 text-sm font-bold uppercase">{t('confirmadas')}</p>
          <p className="text-3xl font-black text-green-900">
            {inscricoesEvento.filter(i => i.status_pagamento === 'Confirmado').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-600 text-sm font-bold uppercase">{t('pendentes')}</p>
          <p className="text-3xl font-black text-yellow-900">
            {inscricoesEvento.filter(i => i.status_pagamento === 'Pendente').length}
          </p>
        </div>
      </div>

      {/* Abas Internas */}
      <div className="flex border-b border-gray-200 px-6 bg-white gap-6">
        <button
          onClick={() => setAbaPainel('inscritos')}
          className={`py-3 font-bold text-sm border-b-4 transition-colors ${
            abaPainel === 'inscritos'
              ? 'border-omega-red text-omega-red'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Controle de Inscritos
        </button>
        <button
          onClick={() => setAbaPainel('arbitros')}
          className={`py-3 font-bold text-sm border-b-4 transition-colors ${
            abaPainel === 'arbitros'
              ? 'border-omega-dark text-omega-dark'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Gestão de Quadras
        </button>
      </div>

      {/* Conteúdo */}
      {abaPainel === 'inscritos' && (
        <div className="flex-1 overflow-x-auto p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">Lista de Inscritos</h3>

          {inscricoesEvento.length === 0 ? (
            <p className="text-center text-gray-500 py-12 border border-dashed rounded-lg bg-gray-50">
              Nenhum atleta inscrito.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wide">
                  <th className="p-3 rounded-tl-lg">Atleta</th>
                  <th className="p-3">Modalidade</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {inscricoesEvento.map((insc, idx) => (
                  <tr
                    key={insc._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="p-3 font-semibold text-gray-800">
                      {insc.atleta_nome}
                      <br />
                      <span className="text-xs text-gray-400 font-normal">{insc.atleta_email}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-600">{insc.modalidade}</td>
                    <td className="p-3 text-gray-600">{getNomeCategoria(insc.categoria_id)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          insc.status_pagamento === 'Confirmado'
                            ? 'bg-green-100 text-green-700'
                            : insc.status_pagamento === 'Cancelado'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {insc.status_pagamento}
                      </span>
                    </td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      {insc.status_pagamento !== 'Confirmado' && (
                        <button
                          onClick={() => alterarStatusInscricao(insc._id, 'Confirmado')}
                          title="Confirmar Pagamento"
                          className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      {insc.status_pagamento !== 'Cancelado' && (
                        <button
                          onClick={() => alterarStatusInscricao(insc._id, 'Cancelado')}
                          title="Cancelar"
                          className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {abaPainel === 'arbitros' && (
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <h3 className="font-bold text-gray-800 text-lg mb-4">
            Atribuição de Árbitros por Quadra
          </h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {Array.from({ length: configCronograma.num_quadras }, (_, i) => i + 1).map(
              numQuadra => {
                const quadra = equipesQuadras.find(q => q.numero_quadra === numQuadra) || {};

                return (
                  <div
                    key={numQuadra}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-omega-dark text-white p-3 flex justify-between items-center">
                      <h4 className="font-bold uppercase tracking-wide">Quadra {numQuadra}</h4>
                      <button
                        onClick={() => salvarEquipeQuadra(numQuadra)}
                        className="bg-omega-red hover:bg-red-700 text-xs px-4 py-1.5 rounded font-bold transition-colors shadow"
                      >
                        Salvar
                      </button>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                            Mesário
                          </label>
                          <select
                            value={quadra.mesario_email || ''}
                            onChange={e =>
                              atualizarMembroQuadra(numQuadra, 'mesario_email', e.target.value)
                            }
                            className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-omega-red"
                          >
                            <option value="">-- Selecione --</option>
                            {listaArbitros.map(arb => (
                              <option key={arb.email} value={arb.email}>
                                {arb.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                            Central
                          </label>
                          <select
                            value={quadra.central_email || ''}
                            onChange={e =>
                              atualizarMembroQuadra(numQuadra, 'central_email', e.target.value)
                            }
                            className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-omega-red"
                          >
                            <option value="">-- Selecione --</option>
                            {listaArbitros.map(arb => (
                              <option key={arb.email} value={arb.email}>
                                {arb.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase text-center bg-gray-100 py-1 rounded">
                          Laterais
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <select
                              key={`lateral${n}`}
                              value={quadra[`lateral${n}_email`] || ''}
                              onChange={e =>
                                atualizarMembroQuadra(
                                  numQuadra,
                                  `lateral${n}_email`,
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 p-2 rounded text-xs outline-none focus:border-blue-500"
                            >
                              <option value="">L{n}</option>
                              {listaArbitros.map(arb => (
                                <option key={`${n}-${arb.email}`} value={arb.email}>
                                  {arb.nome.substring(0, 8)}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
