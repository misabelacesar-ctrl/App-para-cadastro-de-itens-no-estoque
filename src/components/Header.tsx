import React from 'react';
import { Package, TrendingUp, AlertTriangle, ArrowDownLeft, ArrowUpRight, PlusCircle, Database, CheckCircle2 } from 'lucide-react';
import { Artigo, Movement } from '../types/inventory';
import { INSTITUTION_NAME, SYSTEM_NAME } from '../services/storageService';

interface HeaderProps {
  artigos: Artigo[];
  movimentacoes: Movement[];
  lastSaved: string;
  onOpenMovementModal: (type: 'ENTRADA' | 'SAIDA', defaultArtigoId?: string) => void;
  onOpenNewArtigoModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  artigos,
  lastSaved,
  onOpenMovementModal,
  onOpenNewArtigoModal,
}) => {
  // Cálculos rápidos de estoque
  const totalArtigos = artigos.length;
  const totalPecas = artigos.reduce((acc, a) => acc + (a.currentStock || 0), 0);
  const totalValor = artigos.reduce((acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0), 0);
  const itensCriticos = artigos.filter((a) => a.currentStock <= a.minStock).length;

  return (
    <header className="bg-neutral-950 text-white border-b-4 border-[#E30613] shadow-md sticky top-0 z-30">
      {/* Barra superior de identificação institucional SENAI */}
      <div className="bg-[#E30613] text-white px-4 py-1 text-xs font-semibold tracking-wider flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px]">SP</span>
          <span>{INSTITUTION_NAME}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 opacity-90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Persistência Local Ativa</span>
          </span>
          <span className="hidden sm:inline opacity-70">|</span>
          <span className="hidden sm:inline font-mono opacity-80">
            Salvo: {lastSaved ? new Date(lastSaved).toLocaleTimeString('pt-BR') : 'Agora'}
          </span>
        </div>
      </div>

      {/* Conteúdo principal do cabeçalho */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Marca e Título */}
        <div className="flex items-center space-x-3">
          {/* Logo Estilizado SENAI */}
          <div className="w-12 h-12 bg-white text-[#E30613] font-black rounded flex flex-col items-center justify-center shadow font-sans leading-none border-2 border-[#E30613]">
            <span className="text-sm font-extrabold tracking-tighter">SENAI</span>
            <span className="text-[9px] font-bold text-neutral-900 -mt-0.5">SP</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>SIGE</span>
                <span className="text-gray-400 font-light text-base hidden sm:inline">|</span>
                <span className="text-xs sm:text-sm font-normal text-gray-300 hidden sm:inline">
                  Controle de Estoque Industrial
                </span>
              </h1>
              <span className="bg-[#E30613] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                v1.0
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate max-w-md">
              Gestão Hierárquica • Localização Física • Rastreabilidade • Auditoria
            </p>
          </div>
        </div>

        {/* Indicadores Rápidos em Linha */}
        <div className="hidden lg:flex items-center space-x-5 text-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 flex items-center space-x-2.5">
            <Package className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Artigos</div>
              <div className="font-bold text-white text-sm font-mono">{totalArtigos}</div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 flex items-center space-x-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Valor em Estoque</div>
              <div className="font-bold text-emerald-400 text-sm font-mono">
                {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {itensCriticos > 0 ? (
            <div className="bg-red-950/70 border border-red-800/80 rounded px-3 py-1.5 flex items-center space-x-2.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-[10px] text-red-300 uppercase font-semibold">Estoque Crítico</div>
                <div className="font-bold text-red-300 text-sm font-mono">{itensCriticos} itens</div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Saldo Físico</div>
                <div className="font-bold text-gray-200 text-sm font-mono">{totalPecas} un</div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação Rápida em Destaque */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          {/* Botão Registrar Entrada */}
          <button
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] active:scale-95 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded shadow transition-all duration-150 cursor-pointer border border-red-500"
            title="Registrar entrada de materiais no estoque"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>+ Entrada</span>
          </button>

          {/* Botão Registrar Saída */}
          <button
            onClick={() => onOpenMovementModal('SAIDA')}
            className="flex items-center space-x-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded border border-neutral-600 shadow transition-all duration-150 cursor-pointer"
            title="Registrar saída de materiais para ordem de serviço, aula ou manutenção"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5] text-amber-400" />
            <span>- Saída</span>
          </button>

          {/* Botão Novo Artigo */}
          <button
            onClick={onOpenNewArtigoModal}
            className="flex items-center space-x-1 bg-white hover:bg-gray-100 active:scale-95 text-neutral-900 font-semibold text-xs sm:text-sm px-3 py-2 rounded shadow transition-all duration-150 cursor-pointer border border-gray-300"
            title="Cadastrar novo artigo no catálogo hierárquico"
          >
            <PlusCircle className="w-4 h-4 text-[#E30613]" />
            <span className="hidden sm:inline">Novo Artigo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
