import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  MapPin,
  AlertTriangle,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Layers,
} from 'lucide-react';
import { Artigo, Location, Tipo, Grupo, Subgrupo } from '../types/inventory';
import { exportReportToCsv } from '../services/storageService';
import { BarcodeSvg, QrCodePlaceholder } from './BarcodeSvg';

interface StockPositionViewProps {
  artigos: Artigo[];
  tipos: Tipo[];
  grupos: Grupo[];
  subgrupos: Subgrupo[];
  localizacoes: Location[];
  onOpenMovementModal: (type: 'ENTRADA' | 'SAIDA', defaultArtigoId?: string) => void;
  onNavigateToHierarchy: () => void;
}

export const StockPositionView: React.FC<StockPositionViewProps> = ({
  artigos,
  tipos,
  grupos,
  subgrupos,
  localizacoes,
  onOpenMovementModal,
  onNavigateToHierarchy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipoId, setSelectedTipoId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'ZERO'>('ALL');
  const [selectedArtigoModal, setSelectedArtigoModal] = useState<Artigo | null>(null);

  // Filtragem dinâmica
  const filteredArtigos = artigos.filter((art) => {
    // Busca por texto
    const matchSearch =
      !searchTerm ||
      art.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.hierarchicalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.barcode.includes(searchTerm);

    // Filtro por Tipo
    const matchTipo = selectedTipoId === 'ALL' || art.tipoId === selectedTipoId;

    // Filtro por Status
    let matchStatus = true;
    if (statusFilter === 'ZERO') {
      matchStatus = art.currentStock <= 0;
    } else if (statusFilter === 'LOW') {
      matchStatus = art.currentStock > 0 && art.currentStock <= art.minStock;
    } else if (statusFilter === 'NORMAL') {
      matchStatus = art.currentStock > art.minStock;
    }

    return matchSearch && matchTipo && matchStatus;
  });

  const handleExportCsv = () => {
    const headers = [
      'Código Único',
      'Código Hierárquico',
      'Nome do Artigo',
      'Unidade',
      'Saldo Atual',
      'Estoque Mínimo',
      'Estoque Máximo',
      'Custo Unitário (R$)',
      'Valor Total (R$)',
      'Localização',
      'Código de Barras',
    ];

    const rows = filteredArtigos.map((a) => {
      const loc = localizacoes.find((l) => l.id === a.defaultLocationId);
      const locStr = loc ? `${loc.almoxarifado} - ${loc.corredor}/${loc.estante}/${loc.nivel}` : 'Não definida';
      return [
        a.code,
        a.hierarchicalCode,
        a.name,
        a.unit,
        a.currentStock,
        a.minStock,
        a.maxStock,
        a.unitCost.toFixed(2),
        (a.currentStock * a.unitCost).toFixed(2),
        locStr,
        a.barcode,
      ];
    });

    exportReportToCsv('Posicao_Estoque_SENAI_SP', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#E30613]" />
              <span>Posição do Estoque em Tempo Real</span>
            </h2>
            <p className="text-xs text-gray-500">
              {artigos.length} artigos cadastrados • {filteredArtigos.length} correspondentes aos filtros
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={filteredArtigos.length === 0}
              className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded shadow cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Tabela (CSV)</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* Busca Rápida */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, código ART, código hierárquico ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#E30613] focus:bg-white"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={selectedTipoId}
              onChange={(e) => setSelectedTipoId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E30613] focus:bg-white"
            >
              <option value="ALL">Todos os Tipos de Material</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E30613] focus:bg-white"
            >
              <option value="ALL">Todos os Status de Saldo</option>
              <option value="NORMAL">Saldo Normal (Acima do mín)</option>
              <option value="LOW">Estoque Baixo (Crítico / Ponto de pedido)</option>
              <option value="ZERO">Sem Estoque (Saldo Zero)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Artigos em Estoque */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {artigos.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Boxes className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-neutral-800 text-base">Nenhum artigo cadastrado no almoxarifado.</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Utilize o Cadastro Hierárquico para estruturar seus materiais ou cadastre um artigo diretamente.
            </p>
            <button
              onClick={onNavigateToHierarchy}
              className="mt-4 inline-flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-4 py-2 rounded shadow cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Acessar Cadastro Hierárquico</span>
            </button>
          </div>
        ) : filteredArtigos.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Nenhum artigo encontrado com os critérios de busca selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Código / Hierarquia</th>
                  <th className="py-3 px-3.5">Descrição do Artigo</th>
                  <th className="py-3 px-3.5">Localização Física</th>
                  <th className="py-3 px-3.5 text-center">Unid</th>
                  <th className="py-3 px-3.5 text-right">Saldo Atual</th>
                  <th className="py-3 px-3.5 text-right">Mín / Máx</th>
                  <th className="py-3 px-3.5 text-right">Custo Un.</th>
                  <th className="py-3 px-3.5 text-right">Valor Total</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredArtigos.map((art) => {
                  const loc = localizacoes.find((l) => l.id === art.defaultLocationId);
                  const isZero = art.currentStock <= 0;
                  const isLow = !isZero && art.currentStock <= art.minStock;
                  const valorTotalItem = art.currentStock * art.unitCost;

                  return (
                    <tr key={art.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Código */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-neutral-900">{art.code}</div>
                        <div className="font-mono text-[10px] text-[#E30613] font-semibold">
                          {art.hierarchicalCode}
                        </div>
                      </td>

                      {/* Nome / Detalhes */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="font-bold text-neutral-900 text-xs sm:text-sm line-clamp-1">
                          {art.name}
                        </div>
                        {art.specification && (
                          <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                            {art.specification}
                          </div>
                        )}
                      </td>

                      {/* Localização Física */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {loc ? (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                            <div>
                              <div className="font-semibold text-neutral-800 text-[11px]">{loc.almoxarifado}</div>
                              <div className="text-[10px] text-gray-500 font-mono">
                                {loc.corredor} • {loc.estante} • {loc.nivel}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Não definida</span>
                        )}
                      </td>

                      {/* Unidade */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                          {art.unit}
                        </span>
                      </td>

                      {/* Saldo Atual */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-mono text-sm font-extrabold ${
                            isZero
                              ? 'text-neutral-400'
                              : isLow
                              ? 'text-[#E30613]'
                              : 'text-neutral-900'
                          }`}
                        >
                          {art.currentStock.toLocaleString('pt-BR')}
                        </span>
                      </td>

                      {/* Mín / Máx */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap text-[11px] font-mono text-gray-500">
                        {art.minStock} / {art.maxStock}
                      </td>

                      {/* Custo Unitário */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono text-gray-700">
                        {art.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-neutral-900">
                        {valorTotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Badge de Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700">
                            Sem Estoque
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Crítico</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Botões de Ação Rápida */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onOpenMovementModal('ENTRADA', art.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-1.5 rounded cursor-pointer border border-emerald-200"
                            title="Registrar Entrada deste material"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          <button
                            onClick={() => onOpenMovementModal('SAIDA', art.id)}
                            disabled={art.currentStock <= 0}
                            className={`p-1.5 rounded border ${
                              art.currentStock <= 0
                                ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-gray-300 cursor-pointer'
                            }`}
                            title="Registrar Saída deste material"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-amber-600" />
                          </button>

                          <button
                            onClick={() => setSelectedArtigoModal(art)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 p-1.5 rounded cursor-pointer border border-gray-200"
                            title="Ver Etiqueta e Código de Barras"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Artigo e Etiqueta com Código de Barras */}
      {selectedArtigoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="bg-[#E30613] text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                <Barcode className="w-4 h-4" />
                <span>Etiqueta de Almoxarifado • SENAI SP</span>
              </span>
              <button
                onClick={() => setSelectedArtigoModal(null)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cartão de Etiqueta com Borda Industrial */}
              <div className="border-2 border-dashed border-neutral-800 p-4 rounded bg-white space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-[#E30613] text-sm">SENAI SP</span>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">Gestão de Almoxarifado</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-800">{selectedArtigoModal.code}</span>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">{selectedArtigoModal.name}</h4>
                  <p className="font-mono text-xs text-[#E30613] font-semibold mt-0.5">
                    {selectedArtigoModal.hierarchicalCode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Unidade:</span>
                    <span className="font-bold text-neutral-800">{selectedArtigoModal.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Localização:</span>
                    <span className="font-bold text-neutral-800">
                      {localizacoes.find((l) => l.id === selectedArtigoModal.defaultLocationId)?.code || 'A definir'}
                    </span>
                  </div>
                </div>

                {/* Código de Barras e QR Code lado a lado */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex-1">
                    <BarcodeSvg value={selectedArtigoModal.barcode} width={260} height={52} />
                  </div>
                  <div className="ml-3">
                    <QrCodePlaceholder value={selectedArtigoModal.hierarchicalCode} size={64} />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded shadow cursor-pointer"
                >
                  Imprimir Etiqueta
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArtigoModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-neutral-800 text-xs font-semibold px-4 py-2 rounded border border-gray-300 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
