import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  Boxes,
  ArrowLeftRight,
  MapPin,
  FileSpreadsheet,
  CloudUpload,
  AlertTriangle,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'hierarchy'
  | 'stock'
  | 'movements'
  | 'locations'
  | 'reports'
  | 'cloud';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  artigosCount: number;
  criticosCount: number;
  movementsCount: number;
  locationsCount: number;
  tiposCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  artigosCount,
  criticosCount,
  movementsCount,
  locationsCount,
  tiposCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      subtitle: 'Visão executiva',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'hierarchy' as ActiveTab,
      label: 'Cadastro Hierárquico',
      subtitle: 'Tipo > Grupo > Subgrupo > Artigo',
      icon: GitFork,
      badge: tiposCount > 0 ? `${tiposCount} tipos` : null,
      badgeColor: 'bg-neutral-800 text-white',
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Posição do Estoque',
      subtitle: 'Inventário em tempo real',
      icon: Boxes,
      badge: artigosCount > 0 ? `${artigosCount}` : null,
      badgeColor: criticosCount > 0 ? 'bg-[#E30613] text-white animate-pulse' : 'bg-neutral-200 text-neutral-800',
      alert: criticosCount > 0,
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Movimentações',
      subtitle: 'Entradas, Saídas e Kardex',
      icon: ArrowLeftRight,
      badge: movementsCount > 0 ? `${movementsCount}` : null,
      badgeColor: 'bg-neutral-200 text-neutral-800',
    },
    {
      id: 'locations' as ActiveTab,
      label: 'Localizações',
      subtitle: 'Almoxarifados e Prateleiras',
      icon: MapPin,
      badge: locationsCount > 0 ? `${locationsCount}` : null,
      badgeColor: 'bg-neutral-200 text-neutral-800',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Relatórios & Auditoria',
      subtitle: 'Impressão A4, CSV e Etiquetas',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'cloud' as ActiveTab,
      label: 'Nuvem & Backup',
      subtitle: 'GitHub / Drive / Persistência',
      icon: CloudUpload,
      badge: 'Nuvem',
      badgeColor: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <nav className="bg-neutral-900 border-b border-neutral-800 text-white shadow-sm overflow-x-auto scrollbar-thin">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center space-x-1.5 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-md font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? 'bg-[#E30613] text-white border-red-500 shadow-md font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-neutral-800 border-transparent'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.alert && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>

                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${item.badgeColor || 'bg-neutral-700 text-gray-200'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] block leading-none mt-0.5 ${isActive ? 'text-red-100' : 'text-gray-500'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
