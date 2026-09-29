import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  AlertTriangle,
  Boxes,
  ArrowLeftRight,
  MapPin,
  Barcode,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Artigo, Location, Movement, Tipo, Grupo, Subgrupo } from '../types/inventory';
import {
  exportReportToCsv,
  INSTITUTION_NAME,
  SYSTEM_NAME,
  TECHNICAL_MANAGER_NAME,
} from '../services/storageService';
import { BarcodeSvg, QrCodePlaceholder } from './BarcodeSvg';

interface ReportsViewProps {
  artigos: Artigo[];
  tipos: Tipo[];
  grupos: Grupo[];
  subgrupos: Subgrupo[];
  localizacoes: Location[];
  movimentacoes: Movement[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  artigos,
  tipos,
  grupos,
  subgrupos,
  localizacoes,
  movimentacoes,
}) => {
  const [activeReport, setActiveReport] = useState<'POSICAO' | 'KARDEX' | 'CRITICOS' | 'ETIQUETAS'>(
    'POSICAO'
  );

  const totalValor = artigos.reduce((acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0), 0);
  const totalPecas = artigos.reduce((acc, a) => acc + (a.currentStock || 0), 0);
  const criticos = artigos.filter((a) => a.currentStock <= a.minStock);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (activeReport === 'POSICAO') {
      const headers = [
        'Código Artigo',
        'Código Hierárquico',
        'Descrição do Material',
        'Unidade',
        'Saldo Atual',
        'Estoque Mínimo',
        'Estoque Máximo',
        'Custo Unitário (R$)',
        'Valor Total (R$)',
        'Almoxarifado',
        'Corredor/Estante/Nível',
        'Status',
      ];
      const rows = artigos.map((a) => {
        const loc = localizacoes.find((l) => l.id === a.defaultLocationId);
        const status = a.currentStock <= 0 ? 'Sem Estoque' : a.currentStock <= a.minStock ? 'Crítico' : 'Normal';
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
          loc ? loc.almoxarifado : 'Não definida',
          loc ? `${loc.corredor} - ${loc.estante} - ${loc.nivel}` : '',
          status,
        ];
      });
      exportReportToCsv('Relatorio_Posicao_Estoque_SENAI_SP', headers, rows);
    } else if (activeReport === 'KARDEX') {
      const headers = [
        'Data/Hora',
        'Operação',
        'Documento',
        'Código',
        'Código Hierárquico',
        'Material',
        'Quantidade',
        'Saldo Anterior',
        'Saldo Novo',
        'Fornecedor / Turma',
        'Operador',
      ];
      const rows = movimentacoes.map((m) => [
        new Date(m.timestamp).toLocaleString('pt-BR'),
        m.type,
        m.documentNumber,
        m.artigoCode,
        m.hierarchicalCode,
        m.artigoName,
        m.quantity,
        m.previousStock,
        m.newStock,
        m.originOrDestination,
        m.operator,
      ]);
      exportReportToCsv('Relatorio_Movimentacoes_Kardex_SENAI_SP', headers, rows);
    } else if (activeReport === 'CRITICOS') {
      const headers = [
        'Código',
        'Código Hierárquico',
        'Descrição',
        'Saldo Atual',
        'Estoque Mínimo',
        'Reposição Necessária',
        'Custo Unitário',
        'Valor Estimado Pedido',
      ];
      const rows = criticos.map((a) => {
        const necessidade = Math.max(0, a.maxStock - a.currentStock);
        return [
          a.code,
          a.hierarchicalCode,
          a.name,
          a.currentStock,
          a.minStock,
          necessidade,
          a.unitCost.toFixed(2),
          (necessidade * a.unitCost).toFixed(2),
        ];
      });
      exportReportToCsv('Relatorio_Itens_Criticos_Reposicao_SENAI_SP', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Seleção de Relatórios (Oculta na impressão) */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#E30613] font-bold text-xs uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Auditoria Oficial • Emissão de Relatórios</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Central de Relatórios & Posição de Estoque
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Relatórios completos com quantidades, localizações físicas e histórico de movimentações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório (A4 / PDF)</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={artigos.length === 0}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Abas dos 4 Relatórios Disponíveis (Oculto na impressão) */}
      <div className="flex flex-wrap gap-2 print:hidden text-xs">
        <button
          onClick={() => setActiveReport('POSICAO')}
          className={`px-4 py-2.5 rounded-lg font-bold flex items-center space-x-2 cursor-pointer transition-colors border ${
            activeReport === 'POSICAO'
              ? 'bg-[#E30613] text-white border-red-500 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>1. Posição Completa do Estoque ({artigos.length})</span>
        </button>

        <button
          onClick={() => setActiveReport('KARDEX')}
          className={`px-4 py-2.5 rounded-lg font-bold flex items-center space-x-2 cursor-pointer transition-colors border ${
            activeReport === 'KARDEX'
              ? 'bg-[#E30613] text-white border-red-500 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>2. Histórico de Movimentações ({movimentacoes.length})</span>
        </button>

        <button
          onClick={() => setActiveReport('CRITICOS')}
          className={`px-4 py-2.5 rounded-lg font-bold flex items-center space-x-2 cursor-pointer transition-colors border ${
            activeReport === 'CRITICOS'
              ? 'bg-[#E30613] text-white border-red-500 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>3. Ponto de Pedido & Críticos ({criticos.length})</span>
        </button>

        <button
          onClick={() => setActiveReport('ETIQUETAS')}
          className={`px-4 py-2.5 rounded-lg font-bold flex items-center space-x-2 cursor-pointer transition-colors border ${
            activeReport === 'ETIQUETAS'
              ? 'bg-[#E30613] text-white border-red-500 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>4. Etiquetas com Código de Barras</span>
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO OFICIAL FORMATADA PARA IMPRESSÃO A4 */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-300 shadow-sm print:p-0 print:border-none print:shadow-none text-neutral-900">
        {/* Cabeçalho Oficial SENAI SP para Relatórios */}
        <div className="border-b-2 border-[#E30613] pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white text-[#E30613] border-2 border-[#E30613] font-black rounded flex flex-col items-center justify-center font-sans leading-none shadow-xs">
                <span className="text-sm font-extrabold">SENAI</span>
                <span className="text-[9px] font-bold text-neutral-900 -mt-0.5">SP</span>
              </div>
              <div>
                <h1 className="font-bold text-base text-neutral-900 uppercase tracking-tight">
                  {INSTITUTION_NAME}
                </h1>
                <p className="text-xs text-gray-600 font-semibold">{SYSTEM_NAME}</p>
                <p className="text-[11px] text-gray-500">
                  Responsável Técnica: <strong>{TECHNICAL_MANAGER_NAME}</strong> • Engenharia de Software Full-Stack
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-neutral-900">Data de Emissão:</div>
              <div className="font-mono text-gray-600">{new Date().toLocaleString('pt-BR')}</div>
              <div className="text-[10px] text-gray-500 uppercase mt-0.5 font-semibold">Documento Oficial Auditável</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-between items-center text-xs">
            <div className="font-bold text-sm text-[#E30613] uppercase tracking-wide">
              {activeReport === 'POSICAO' && 'Relatório de Posição Completa do Estoque e Localizações'}
              {activeReport === 'KARDEX' && 'Relatório Histórico de Movimentações de Materiais (Livro Kardex)'}
              {activeReport === 'CRITICOS' && 'Relatório de Reposição e Artigos Abaixo do Estoque Mínimo'}
              {activeReport === 'ETIQUETAS' && 'Grade de Etiquetas Industriais com Código de Barras e QR Code'}
            </div>
            <div className="text-gray-500 font-mono text-[11px]">
              Total Cadastrado: {artigos.length} artigos • Saldo Físico: {totalPecas} un • Patrimônio:{' '}
              {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RELATÓRIO 1: POSIÇÃO COMPLETA DO ESTOQUE */}
        {/* ========================================================= */}
        {activeReport === 'POSICAO' && (
          <div className="space-y-4">
            {artigos.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhum dado cadastrado para exibição neste relatório.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-300 divide-y divide-gray-300">
                  <thead className="bg-neutral-100 text-neutral-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 border-r">Código / Hierarquia</th>
                      <th className="py-2.5 px-3 border-r">Descrição do Material</th>
                      <th className="py-2.5 px-3 border-r">Localização Física</th>
                      <th className="py-2.5 px-2 text-center border-r">Un</th>
                      <th className="py-2.5 px-3 text-right border-r">Saldo</th>
                      <th className="py-2.5 px-3 text-right border-r">Mínimo</th>
                      <th className="py-2.5 px-3 text-right border-r">Custo (R$)</th>
                      <th className="py-2.5 px-3 text-right border-r">Total (R$)</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {artigos.map((art) => {
                      const loc = localizacoes.find((l) => l.id === art.defaultLocationId);
                      const isLow = art.currentStock <= art.minStock;
                      const isZero = art.currentStock <= 0;

                      return (
                        <tr key={art.id} className="hover:bg-gray-50 text-[11px]">
                          <td className="py-2 px-3 border-r font-mono">
                            <span className="font-bold text-neutral-900">{art.code}</span>
                            <span className="block text-[10px] text-gray-500">{art.hierarchicalCode}</span>
                          </td>
                          <td className="py-2 px-3 border-r font-medium text-neutral-900 max-w-xs">
                            {art.name}
                            {art.specification && (
                              <span className="block text-[10px] text-gray-500 truncate">{art.specification}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r text-gray-700">
                            {loc ? (
                              <div>
                                <span className="font-semibold block">{loc.almoxarifado}</span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {loc.corredor} / {loc.estante} / {loc.nivel}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Não alocado</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center border-r font-mono font-bold text-gray-700">
                            {art.unit}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold">
                            <span className={isZero ? 'text-gray-400' : isLow ? 'text-red-700' : 'text-neutral-900'}>
                              {art.currentStock}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono text-gray-500">
                            {art.minStock}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono text-gray-700">
                            {art.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold text-neutral-900">
                            {(art.currentStock * art.unitCost).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[10px]">
                            {isZero ? (
                              <span className="text-gray-500">Zerado</span>
                            ) : isLow ? (
                              <span className="text-red-700 font-bold">Crítico</span>
                            ) : (
                              <span className="text-emerald-700">Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 border-r text-right uppercase">
                        Totais Gerais:
                      </td>
                      <td className="py-2.5 px-3 text-right border-r font-mono font-extrabold text-neutral-900">
                        {totalPecas.toLocaleString('pt-BR')}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 border-r"></td>
                      <td className="py-2.5 px-3 text-right border-r font-mono font-extrabold text-neutral-900">
                        {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* RELATÓRIO 2: HISTÓRICO DE MOVIMENTAÇÕES (KARDEX) */}
        {/* ========================================================= */}
        {activeReport === 'KARDEX' && (
          <div className="space-y-4">
            {movimentacoes.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhuma movimentação registrada no histórico.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-300 divide-y divide-gray-300">
                  <thead className="bg-neutral-100 text-neutral-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 border-r">Data/Hora</th>
                      <th className="py-2.5 px-2 text-center border-r">Tipo</th>
                      <th className="py-2.5 px-3 border-r">Documento</th>
                      <th className="py-2.5 px-3 border-r">Material / Código</th>
                      <th className="py-2.5 px-3 border-r">Origem / Destino</th>
                      <th className="py-2.5 px-3 text-right border-r">Qtd</th>
                      <th className="py-2.5 px-3 text-right border-r">Saldo Final</th>
                      <th className="py-2.5 px-3 border-r">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-[11px]">
                    {movimentacoes.map((mov) => {
                      const isEntrada = mov.type === 'ENTRADA';
                      return (
                        <tr key={mov.id}>
                          <td className="py-2 px-3 border-r whitespace-nowrap font-mono text-gray-600">
                            {new Date(mov.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 px-2 border-r text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-800 text-white'
                              }`}
                            >
                              {mov.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r font-mono font-semibold">
                            {mov.documentNumber}
                          </td>
                          <td className="py-2 px-3 border-r max-w-xs">
                            <div className="font-semibold text-neutral-900">{mov.artigoName}</div>
                            <div className="font-mono text-[10px] text-gray-500">{mov.hierarchicalCode}</div>
                          </td>
                          <td className="py-2 px-3 border-r text-gray-700">
                            {mov.originOrDestination}
                            {mov.locationDisplay && (
                              <div className="text-[10px] text-gray-500 font-mono">{mov.locationDisplay}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold">
                            <span className={isEntrada ? 'text-emerald-700' : 'text-neutral-900'}>
                              {isEntrada ? '+' : '-'}
                              {mov.quantity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold text-neutral-800">
                            {mov.newStock}
                          </td>
                          <td className="py-2 px-3 border-r text-gray-600 text-[10px]">
                            {mov.operator}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* RELATÓRIO 3: PONTO DE PEDIDO & REPOSIÇÃO */}
        {/* ========================================================= */}
        {activeReport === 'CRITICOS' && (
          <div className="space-y-4">
            {criticos.length === 0 ? (
              <div className="py-12 text-center text-emerald-800 bg-emerald-50 rounded border border-emerald-200 text-xs font-semibold">
                ✓ Todos os materiais estão operando com saldo acima do estoque mínimo de segurança.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-300 divide-y divide-gray-300">
                  <thead className="bg-red-50 text-red-900 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 border-r">Código</th>
                      <th className="py-2.5 px-3 border-r">Material</th>
                      <th className="py-2.5 px-3 border-r">Localização</th>
                      <th className="py-2.5 px-3 text-right border-r">Saldo Atual</th>
                      <th className="py-2.5 px-3 text-right border-r">Estoque Mínimo</th>
                      <th className="py-2.5 px-3 text-right border-r">Estoque Máximo</th>
                      <th className="py-2.5 px-3 text-right border-r">Necessidade Compra</th>
                      <th className="py-2.5 px-3 text-right">Custo Est. (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-[11px]">
                    {criticos.map((art) => {
                      const loc = localizacoes.find((l) => l.id === art.defaultLocationId);
                      const necessidade = Math.max(0, art.maxStock - art.currentStock);
                      const custoEstimado = necessidade * art.unitCost;

                      return (
                        <tr key={art.id}>
                          <td className="py-2 px-3 border-r font-mono font-bold text-[#E30613]">
                            {art.code}
                          </td>
                          <td className="py-2 px-3 border-r font-semibold text-neutral-900">
                            {art.name}
                          </td>
                          <td className="py-2 px-3 border-r text-gray-600 font-mono text-[10px]">
                            {loc ? `${loc.almoxarifado} (${loc.corredor})` : 'A definir'}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold text-red-700">
                            {art.currentStock} {art.unit}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono text-gray-600">
                            {art.minStock} {art.unit}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono text-gray-600">
                            {art.maxStock} {art.unit}
                          </td>
                          <td className="py-2 px-3 text-right border-r font-mono font-bold text-neutral-900 bg-amber-50">
                            {necessidade} {art.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                            {custoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* RELATÓRIO 4: ETIQUETAS DE ALMOXARIFADO COM CÓDIGO DE BARRAS */}
        {/* ========================================================= */}
        {activeReport === 'ETIQUETAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {artigos.map((art) => {
              const loc = localizacoes.find((l) => l.id === art.defaultLocationId);
              return (
                <div
                  key={art.id}
                  className="border-2 border-dashed border-gray-400 p-3 rounded bg-white flex flex-col justify-between space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center border-b pb-1 text-[10px]">
                    <span className="font-extrabold text-[#E30613]">SENAI SP</span>
                    <span className="font-mono font-bold text-neutral-800">{art.code}</span>
                  </div>

                  <div>
                    <h5 className="font-bold text-neutral-900 line-clamp-1">{art.name}</h5>
                    <p className="font-mono text-[10px] text-[#E30613] font-semibold">{art.hierarchicalCode}</p>
                  </div>

                  <div className="text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded flex justify-between font-mono">
                    <span>Unid: {art.unit}</span>
                    <span>Loc: {loc?.code || 'S/L'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <BarcodeSvg value={art.barcode} width={180} height={42} />
                    <QrCodePlaceholder value={art.hierarchicalCode} size={48} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé Oficial para Assinatura e Validação Técnica */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-t border-gray-400 pt-2 text-center w-64 mx-auto sm:mx-0">
              <div className="font-bold text-neutral-900">{TECHNICAL_MANAGER_NAME}</div>
              <div className="text-gray-500 text-[10px]">Responsável Técnico / Engenharia de Sistemas</div>
              <div className="text-gray-400 text-[9px] mt-0.5 font-mono">SENAI-SP • Certificação de Estoque</div>
            </div>
          </div>

          <div className="text-right text-gray-500 text-[11px] space-y-1">
            <p>
              Relatório gerado eletronicamente através do <strong>SIGE Estoque SENAI SP</strong>.
            </p>
            <p className="text-[10px]">
              Controle hierárquico: Tipo &gt; Grupo &gt; Subgrupo &gt; Artigo • Rastreabilidade ativa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
