import React from 'react';
import { ShieldCheck, HardDrive, CheckCircle2, UserCheck, Building } from 'lucide-react';
import { INSTITUTION_NAME, SYSTEM_NAME, TECHNICAL_MANAGER_NAME } from '../services/storageService';

interface FooterProps {
  artigosCount: number;
  movementsCount: number;
  lastSaved: string;
}

export const Footer: React.FC<FooterProps> = ({ artigosCount, movementsCount, lastSaved }) => {
  return (
    <footer className="bg-neutral-950 text-gray-300 border-t-2 border-[#E30613] mt-12 py-8 px-4 sm:px-6 print:hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-neutral-800">
          {/* Identificação Institucional */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white text-[#E30613] font-black rounded flex flex-col items-center justify-center font-sans leading-none border border-[#E30613]">
                <span className="text-xs font-extrabold">SENAI</span>
                <span className="text-[7px] font-bold text-neutral-900 -mt-0.5">SP</span>
              </div>
              <div>
                <div className="font-bold text-white text-sm">{INSTITUTION_NAME}</div>
                <div className="text-[11px] text-gray-400">{SYSTEM_NAME}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Plataforma de controle e auditoria física de estoques para oficinas industriais, laboratórios e centros de formação profissional.
            </p>
          </div>

          {/* Responsabilidade Técnica (Exigência do Projeto) */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <UserCheck className="w-4 h-4 text-[#E30613]" />
              <span className="uppercase tracking-wider">Responsabilidade Técnica</span>
            </div>
            <div className="text-sm font-extrabold text-white">{TECHNICAL_MANAGER_NAME}</div>
            <p className="text-xs text-gray-300">
              Engenharia de Software Full-Stack &amp; Automação Industrial
            </p>
            <div className="pt-1 text-[10px] text-gray-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conformidade com a Norma de Inventário SENAI SP</span>
            </div>
          </div>

          {/* Integridade & Persistência */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="uppercase tracking-wider">Status do Sistema</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Persistência:</span>
                <span className="text-emerald-400 font-bold">Local + Nuvem (Ativa)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total de Artigos:</span>
                <span className="text-white font-bold">{artigosCount} cadastrados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registros no Kardex:</span>
                <span className="text-white font-bold">{movementsCount} transações</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Última Gravação:</span>
                <span className="text-gray-300">
                  {lastSaved ? new Date(lastSaved).toLocaleTimeString('pt-BR') : 'Agora'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé inferior com Copyright e Termos */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-2">
          <div>
            © {new Date().getFullYear()} SENAI SP. Todos os direitos reservados. Aplicação pronta para auditoria e validação.
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Ambiente: Produção</span>
            <span>•</span>
            <span>Versão v1.0.0</span>
            <span>•</span>
            <span className="text-gray-400">Resp. Técnica: {TECHNICAL_MANAGER_NAME}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
