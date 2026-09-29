import React from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  GitFork,
  MapPin,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Artigo, Location, Movement, Tipo } from '../types/inventory';
import { INSTITUTION_NAME, TECHNICAL_MANAGER_NAME } from '../services/storageService';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  tipos: Tipo[];
  artigos: Artigo[];
  localizacoes: Location[];
  movimentacoes: Movement[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMovementModal: (type: 'ENTRADA' | 'SAIDA', defaultArtigoId?: string) => void;
  onLoadDemoData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tipos,
  artigos,
  localizacoes,
  movimentacoes,
  setActiveTab,
  onOpenMovementModal,
  onLoadDemoData,
}) => {
  const totalArtigos = artigos.length;
  const totalPecas = artigos.reduce((acc, a) => acc + (a.currentStock || 0), 0);
  const valorTotal = artigos.reduce((acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0), 0);
  const criticos = artigos.filter((a) => a.currentStock <= a.minStock);

  const ultimasMovimentacoes = [...movimentacoes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 5);

  const entradasRecentes = movimentacoes.filter((m) => m.type === 'ENTRADA');
  const saidasRecentes = movimentacoes.filter((m) => m.type === 'SAIDA');

  const isEmpty = totalArtigos === 0 && tipos.length === 0;

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas & Status SENAI SP */}
      <div className="bg-white border-l-4 border-[#E30613] p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#E30613] uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>{INSTITUTION_NAME}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
            Painel Geral de Controle de Almoxarifado
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Ambiente pronto para auditoria, movimentações e validação de estoques industriais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isEmpty && (
            <button
              onClick={onLoadDemoData}
              className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-2 rounded shadow cursor-pointer border border-neutral-700 transition-colors"
              title="Preenche a base com exemplos de oficina para testar todos os fluxos imediatamente"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Carregar Dados de Exemplo (Opcional)</span>
            </button>
          )}

          <button
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => onOpenMovementModal('SAIDA')}
            className="flex items-center space-x-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            <span>Registrar Saída</span>
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Industriais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Artigos */}
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-[#E30613] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Itens Cadastrados</span>
            <div className="p-2 bg-neutral-100 rounded group-hover:bg-red-50 transition-colors">
              <Boxes className="w-5 h-5 text-neutral-800 group-hover:text-[#E30613]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">{totalArtigos}</span>
            <span className="text-xs text-gray-500">{tipos.length} Tipos ativos</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1 group-hover:text-[#E30613]">
            <span>Ver tabela completa</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* KPI 2: Saldo Físico Total */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Saldo Físico Geral</span>
            <div className="p-2 bg-neutral-100 rounded">
              <TrendingUp className="w-5 h-5 text-neutral-800" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">
              {totalPecas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-gray-500">Unidades/Peças</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">Saldo acumulado em todos os almoxarifados</div>
        </div>

        {/* KPI 3: Valor Financeiro */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Patrimônio em Estoque</span>
            <div className="p-2 bg-emerald-50 rounded">
              <span className="text-emerald-700 font-bold text-sm">R$</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">Valor contábil com base no custo unitário</div>
        </div>

        {/* KPI 4: Alertas de Reposição / Estoque Crítico */}
        <div
          onClick={() => setActiveTab('stock')}
          className={`p-5 rounded-lg border shadow-sm transition-all cursor-pointer ${
            criticos.length > 0
              ? 'bg-red-50 border-red-300 hover:border-[#E30613]'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${criticos.length > 0 ? 'text-[#E30613]' : 'text-gray-500'}`}>
              Ponto de Pedido / Crítico
            </span>
            <div className={`p-2 rounded ${criticos.length > 0 ? 'bg-red-200/80 text-[#E30613]' : 'bg-neutral-100 text-neutral-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${criticos.length > 0 ? 'text-[#E30613]' : 'text-neutral-900'}`}>
              {criticos.length}
            </span>
            <span className="text-xs text-gray-500">Artigos em alerta</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {criticos.length > 0 ? 'Requer emissão de pedido de reposição' : 'Nenhum item com estoque insuficiente'}
          </div>
        </div>
      </div>

      {/* Se o banco estiver vazio, exibe instruções passo a passo para testes */}
      {isEmpty && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold text-lg mb-2">
            <GitFork className="w-5 h-5 text-[#E30613]" />
            <h3>Estrutura Pronta para Testes e Validação</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 max-w-2xl">
            O banco de dados foi iniciado vazio conforme solicitado. Você pode cadastrar sua própria estrutura hierárquica passo a passo ou carregar dados de demonstração da oficina SENAI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded p-4 bg-gray-50/50">
              <div className="w-7 h-7 bg-[#E30613] text-white rounded-full flex items-center justify-center font-bold text-xs mb-2">
                1
              </div>
              <h4 className="font-bold text-sm text-neutral-900">1° Cadastre o Tipo</h4>
              <p className="text-xs text-gray-500 mt-1">
                Ex: Ferramental, Matéria-Prima, EPIs, Eletrônica. O código é gerado automaticamente (ex: TIP-01).
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4 bg-gray-50/50">
              <div className="w-7 h-7 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-xs mb-2">
                2
              </div>
              <h4 className="font-bold text-sm text-neutral-900">2° Crie Grupos e Subgrupos</h4>
              <p className="text-xs text-gray-500 mt-1">
                Hierarquia aninhada com códigos gerados automaticamente (ex: TIP-01.GRP-01.SUB-01).
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4 bg-gray-50/50">
              <div className="w-7 h-7 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-xs mb-2">
                3
              </div>
              <h4 className="font-bold text-sm text-neutral-900">3° Cadastre Artigos</h4>
              <p className="text-xs text-gray-500 mt-1">
                Gera código interno único (ART-0001), código de barras e localização de armazenagem.
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4 bg-gray-50/50">
              <div className="w-7 h-7 bg-[#E30613] text-white rounded-full flex items-center justify-center font-bold text-xs mb-2">
                4
              </div>
              <h4 className="font-bold text-sm text-neutral-900">4° Registre Movimentações</h4>
              <p className="text-xs text-gray-500 mt-1">
                Entradas e Saídas com rastreabilidade, emissão de relatórios e exportação.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className="bg-[#E30613] hover:bg-[#c4000f] text-white text-sm font-bold px-4 py-2 rounded shadow cursor-pointer transition-colors"
            >
              Iniciar Cadastro Hierárquico
            </button>
            <button
              onClick={onLoadDemoData}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold px-4 py-2 rounded border border-gray-300 cursor-pointer transition-colors"
            >
              Ou preencher com dados demonstrativos SENAI
            </button>
          </div>
        </div>
      )}

      {/* Painéis Centrais: Últimas Movimentações e Itens em Destaque */}
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Últimas Movimentações do Kardex */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#E30613]" />
                <h3 className="font-bold text-neutral-900 text-sm">Últimas Movimentações Registradas</h3>
              </div>
              <button
                onClick={() => setActiveTab('movements')}
                className="text-xs text-[#E30613] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas ({movimentacoes.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4">
              {ultimasMovimentacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma movimentação registrada até o momento.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ultimasMovimentacoes.map((mov) => {
                    const isEntrada = mov.type === 'ENTRADA';
                    return (
                      <div key={mov.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`p-1.5 rounded font-mono font-bold flex items-center justify-center ${
                              isEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {isEntrada ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </span>

                          <div>
                            <div className="font-semibold text-neutral-900 text-sm">{mov.artigoName}</div>
                            <div className="text-gray-500 font-mono text-[11px] flex items-center gap-2">
                              <span>{mov.hierarchicalCode}</span>
                              <span>•</span>
                              <span>Doc: {mov.documentNumber}</span>
                              <span>•</span>
                              <span>{mov.originOrDestination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono font-bold text-sm ${
                              isEntrada ? 'text-emerald-700' : 'text-neutral-900'
                            }`}
                          >
                            {isEntrada ? '+' : '-'}
                            {mov.quantity} un
                          </div>
                          <div className="text-gray-400 text-[10px]">
                            {new Date(mov.timestamp).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(mov.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Alertas de Estoque e Resumo Rápido */}
          <div className="space-y-4">
            {/* Box de Itens em Nível Crítico */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#E30613]" />
                  <span>Itens Abaixo do Mínimo</span>
                </h3>
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded font-mono">
                  {criticos.length}
                </span>
              </div>

              {criticos.length === 0 ? (
                <div className="text-xs text-gray-500 py-3 bg-emerald-50 rounded p-2 text-center text-emerald-800 font-medium">
                  ✓ Todos os artigos estão com saldo acima do estoque mínimo regulamentar.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {criticos.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded border border-red-200 bg-red-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 line-clamp-1">{item.name}</div>
                        <div className="text-gray-500 font-mono text-[10px]">{item.hierarchicalCode}</div>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <div className="font-bold text-[#E30613] font-mono">
                          {item.currentStock} / mín {item.minStock}
                        </div>
                        <button
                          onClick={() => onOpenMovementModal('ENTRADA', item.id)}
                          className="text-[10px] text-[#E30613] hover:underline font-bold cursor-pointer"
                        >
                          + Repor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Box de Segurança Técnica & Auditoria SENAI */}
            <div className="bg-neutral-900 text-white rounded-lg p-4 shadow-sm border border-neutral-800 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Auditoria e Integridade</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Rastreabilidade de cada item com registro obrigatório de documento fiscal/OS, solicitante e operador.
              </p>
              <div className="mt-3 pt-2.5 border-t border-neutral-800 flex justify-between items-center text-[10px] text-gray-400">
                <span>Resp. Técnica: {TECHNICAL_MANAGER_NAME}</span>
                <span className="font-mono text-emerald-400">Sistema Conforme</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
