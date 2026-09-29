import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  User,
  MapPin,
  Clock,
} from 'lucide-react';
import { Movement, Artigo } from '../types/inventory';
import { exportReportToCsv } from '../services/storageService';

interface MovementViewProps {
  movimentacoes: Movement[];
  artigos: Artigo[];
  onOpenMovementModal: (type: 'ENTRADA' | 'SAIDA') => void;
}

export const MovementView: React.FC<MovementViewProps> = ({
  movimentacoes,
  artigos,
  onOpenMovementModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ENTRADA' | 'SAIDA'>('ALL');

  // Ordenar decrescente por data/hora
  const sortedMovements = [...movimentacoes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredMovements = sortedMovements.filter((m) => {
    const matchType = filterType === 'ALL' || m.type === filterType;
    const matchSearch =
      !searchTerm ||
      m.artigoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.artigoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.hierarchicalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.originOrDestination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchType && matchSearch;
  });

  const totalEntradas = movimentacoes.filter((m) => m.type === 'ENTRADA').length;
  const totalSaidas = movimentacoes.filter((m) => m.type === 'SAIDA').length;

  const handleExportCsv = () => {
    const headers = [
      'Data/Hora',
      'Tipo',
      'Documento',
      'Código Artigo',
      'Código Hierárquico',
      'Descrição Artigo',
      'Quantidade',
      'Saldo Anterior',
      'Saldo Resultante',
      'Custo Un. (R$)',
      'Valor Total (R$)',
      'Origem / Destino',
      'Motivo',
      'Localização',
      'Operador',
      'Observações',
    ];

    const rows = filteredMovements.map((m) => [
      new Date(m.timestamp).toLocaleString('pt-BR'),
      m.type,
      m.documentNumber,
      m.artigoCode,
      m.hierarchicalCode,
      m.artigoName,
      m.quantity,
      m.previousStock,
      m.newStock,
      (m.unitCost || 0).toFixed(2),
      (m.totalValue || 0).toFixed(2),
      m.originOrDestination,
      m.reason,
      m.locationDisplay || 'Padrão',
      m.operator,
      m.notes || '',
    ]);

    exportReportToCsv('Historico_Movimentacoes_Kardex_SENAI_SP', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Título e Ações Rápidas */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#E30613] font-bold text-xs uppercase tracking-wider">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Rastreabilidade Total • Livro Kardex</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Registro Histórico de Movimentações
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Entradas de suprimentos e saídas com controle de documentos, lotes e solicitantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Registrar Entrada</span>
          </button>

          <button
            onClick={() => onOpenMovementModal('SAIDA')}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            <span>- Registrar Saída</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredMovements.length === 0}
            className="flex items-center space-x-1.5 bg-white hover:bg-gray-100 text-neutral-800 border border-gray-300 text-xs font-semibold px-3 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cartões Rápidos de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Total de Registros</div>
            <div className="text-2xl font-bold text-neutral-900 font-mono mt-1">{movimentacoes.length}</div>
          </div>
          <div className="p-2.5 bg-neutral-100 rounded">
            <FileText className="w-5 h-5 text-neutral-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-700 font-bold uppercase">Entradas Realizadas</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">{totalEntradas}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded">
            <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-700 font-bold uppercase">Saídas / Requisições</div>
            <div className="text-2xl font-bold text-neutral-900 font-mono mt-1">{totalSaidas}</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded">
            <ArrowUpRight className="w-5 h-5 text-amber-700" />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por artigo, código, documento (NF/OS), turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#E30613] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded font-bold transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({movimentacoes.length})
          </button>
          <button
            onClick={() => setFilterType('ENTRADA')}
            className={`px-3 py-1.5 rounded font-bold transition-colors cursor-pointer ${
              filterType === 'ENTRADA'
                ? 'bg-[#E30613] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            + Entradas ({totalEntradas})
          </button>
          <button
            onClick={() => setFilterType('SAIDA')}
            className={`px-3 py-1.5 rounded font-bold transition-colors cursor-pointer ${
              filterType === 'SAIDA'
                ? 'bg-neutral-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            - Saídas ({totalSaidas})
          </button>
        </div>
      </div>

      {/* Tabela do Livro Kardex */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {movimentacoes.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <ArrowLeftRight className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-neutral-800 text-base">Nenhuma movimentação de estoque registrada.</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Utilize os botões "+ Registrar Entrada" ou "- Registrar Saída" para movimentar materiais.
            </p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Nenhuma movimentação encontrada para o filtro informado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Data / Hora</th>
                  <th className="py-3 px-3.5 text-center">Tipo</th>
                  <th className="py-3 px-3.5">Documento</th>
                  <th className="py-3 px-3.5">Artigo / Código</th>
                  <th className="py-3 px-3.5">Origem / Destino</th>
                  <th className="py-3 px-3.5 text-right">Qtd</th>
                  <th className="py-3 px-3.5 text-right">Saldo Resultante</th>
                  <th className="py-3 px-3.5 text-right">Valor Total</th>
                  <th className="py-3 px-3.5">Operador / Resp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((mov) => {
                  const isEntrada = mov.type === 'ENTRADA';

                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Data / Hora */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-neutral-900">
                          {new Date(mov.timestamp).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {new Date(mov.timestamp).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEntrada
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-neutral-800 text-white'
                          }`}
                        >
                          {isEntrada ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 text-amber-400" />}
                          <span>{mov.type}</span>
                        </span>
                      </td>

                      {/* Documento */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-neutral-800 bg-gray-100 px-1.5 py-0.5 rounded border text-[11px]">
                          {mov.documentNumber}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{mov.reason}</div>
                      </td>

                      {/* Artigo */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="font-bold text-neutral-900 line-clamp-1">{mov.artigoName}</div>
                        <div className="font-mono text-[10px] text-gray-500">
                          {mov.hierarchicalCode}
                        </div>
                      </td>

                      {/* Origem / Destino */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="text-neutral-800 font-medium">{mov.originOrDestination}</div>
                        {mov.locationDisplay && (
                          <div className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-[#E30613]" />
                            <span>{mov.locationDisplay}</span>
                          </div>
                        )}
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isEntrada ? 'text-emerald-700' : 'text-neutral-900'
                          }`}
                        >
                          {isEntrada ? '+' : '-'}
                          {mov.quantity}
                        </span>
                      </td>

                      {/* Saldo Resultante */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono">
                        <div className="font-bold text-neutral-900">{mov.newStock}</div>
                        <div className="text-[10px] text-gray-400">Anterior: {mov.previousStock}</div>
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono text-neutral-800">
                        {(mov.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Operador */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-gray-600 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{mov.operator}</span>
                        </div>
                        {mov.notes && <div className="text-[10px] text-gray-400 italic truncate max-w-xs">Obs: {mov.notes}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
