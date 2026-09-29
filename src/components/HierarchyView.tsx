import React, { useState } from 'react';
import {
  GitFork,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Layers,
  Package,
  Barcode,
  Search,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Tipo, Grupo, Subgrupo, Artigo, Location } from '../types/inventory';
import {
  generateNextTipoCode,
  generateNextGrupoCode,
  generateNextSubgrupoCode,
  generateNextArtigoCodes,
} from '../services/storageService';
import { BarcodeSvg } from './BarcodeSvg';

interface HierarchyViewProps {
  tipos: Tipo[];
  grupos: Grupo[];
  subgrupos: Subgrupo[];
  artigos: Artigo[];
  localizacoes: Location[];
  onAddTipo: (tipo: Tipo) => void;
  onUpdateTipo: (tipo: Tipo) => void;
  onDeleteTipo: (id: string) => void;
  onAddGrupo: (grupo: Grupo) => void;
  onUpdateGrupo: (grupo: Grupo) => void;
  onDeleteGrupo: (id: string) => void;
  onAddSubgrupo: (subgrupo: Subgrupo) => void;
  onUpdateSubgrupo: (subgrupo: Subgrupo) => void;
  onDeleteSubgrupo: (id: string) => void;
  onAddArtigo: (artigo: Artigo) => void;
  onUpdateArtigo: (artigo: Artigo) => void;
  onDeleteArtigo: (id: string) => void;
  initialOpenArtigoModal?: boolean;
}

export const HierarchyView: React.FC<HierarchyViewProps> = ({
  tipos,
  grupos,
  subgrupos,
  artigos,
  localizacoes,
  onAddTipo,
  onUpdateTipo,
  onDeleteTipo,
  onAddGrupo,
  onUpdateGrupo,
  onDeleteGrupo,
  onAddSubgrupo,
  onUpdateSubgrupo,
  onDeleteSubgrupo,
  onAddArtigo,
  onUpdateArtigo,
  onDeleteArtigo,
  initialOpenArtigoModal = false,
}) => {
  // Estado de nós expandidos na árvore
  const [expandedTipos, setExpandedTipos] = useState<Record<string, boolean>>({});
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({});
  const [expandedSubgrupos, setExpandedSubgrupos] = useState<Record<string, boolean>>({});

  // Filtro de busca na árvore
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de Criação / Edição
  const [activeModal, setActiveModal] = useState<'tipo' | 'grupo' | 'subgrupo' | 'artigo' | null>(
    initialOpenArtigoModal ? 'artigo' : null
  );
  const [editingItem, setEditingItem] = useState<any>(null);

  // Seleções para pré-definir formulários
  const [selectedTipoId, setSelectedTipoId] = useState<string>(tipos[0]?.id || '');
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
  const [selectedSubgrupoId, setSelectedSubgrupoId] = useState<string>('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Form states Artigo
  const [artUnit, setArtUnit] = useState<Artigo['unit']>('UN');
  const [artMinStock, setArtMinStock] = useState<number>(10);
  const [artMaxStock, setArtMaxStock] = useState<number>(100);
  const [artInitialStock, setArtInitialStock] = useState<number>(0);
  const [artCost, setArtCost] = useState<number>(0);
  const [artLocationId, setArtLocationId] = useState<string>('');
  const [artSpec, setArtSpec] = useState<string>('');

  const toggleTipo = (id: string) => {
    setExpandedTipos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGrupo = (id: string) => {
    setExpandedGrupos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubgrupo = (id: string) => {
    setExpandedSubgrupos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------------------------------------------
  // HANDLERS DE ABERTURA DE MODAL
  // -------------------------------------------------------------

  const openNewTipoModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDesc('');
    setActiveModal('tipo');
  };

  const openNewGrupoModal = (tipoId?: string) => {
    setEditingItem(null);
    setSelectedTipoId(tipoId || tipos[0]?.id || '');
    setFormName('');
    setFormDesc('');
    setActiveModal('grupo');
  };

  const openNewSubgrupoModal = (grupoId?: string, tipoId?: string) => {
    setEditingItem(null);
    if (tipoId) setSelectedTipoId(tipoId);
    setSelectedGrupoId(grupoId || grupos.find((g) => g.tipoId === (tipoId || selectedTipoId))?.id || '');
    setFormName('');
    setFormDesc('');
    setActiveModal('subgrupo');
  };

  const openNewArtigoModal = (subgrupoId?: string) => {
    setEditingItem(null);
    const sub = subgrupos.find((s) => s.id === subgrupoId) || subgrupos[0];
    if (sub) {
      setSelectedSubgrupoId(sub.id);
      setSelectedGrupoId(sub.grupoId);
      setSelectedTipoId(sub.tipoId);
    }
    setFormName('');
    setFormDesc('');
    setArtUnit('UN');
    setArtMinStock(10);
    setArtMaxStock(100);
    setArtInitialStock(0);
    setArtCost(0);
    setArtLocationId(localizacoes[0]?.id || '');
    setArtSpec('');
    setActiveModal('artigo');
  };

  // -------------------------------------------------------------
  // SALVAR ENTIDADES
  // -------------------------------------------------------------

  const handleSaveTipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      onUpdateTipo({
        ...editingItem,
        name: formName.trim(),
        description: formDesc.trim(),
      });
    } else {
      const code = generateNextTipoCode(tipos);
      const newTipo: Tipo = {
        id: 'tip_' + Date.now(),
        code,
        name: formName.trim(),
        description: formDesc.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddTipo(newTipo);
      setExpandedTipos((prev) => ({ ...prev, [newTipo.id]: true }));
    }
    setActiveModal(null);
  };

  const handleSaveGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !selectedTipoId) return;

    const tipo = tipos.find((t) => t.id === selectedTipoId);
    if (!tipo) return;

    if (editingItem) {
      onUpdateGrupo({
        ...editingItem,
        tipoId: selectedTipoId,
        name: formName.trim(),
        description: formDesc.trim(),
      });
    } else {
      const code = generateNextGrupoCode(tipo, grupos);
      const newGrupo: Grupo = {
        id: 'grp_' + Date.now(),
        tipoId: selectedTipoId,
        code,
        name: formName.trim(),
        description: formDesc.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddGrupo(newGrupo);
      setExpandedGrupos((prev) => ({ ...prev, [newGrupo.id]: true }));
    }
    setActiveModal(null);
  };

  const handleSaveSubgrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !selectedGrupoId) return;

    const grupo = grupos.find((g) => g.id === selectedGrupoId);
    if (!grupo) return;

    if (editingItem) {
      onUpdateSubgrupo({
        ...editingItem,
        grupoId: selectedGrupoId,
        tipoId: grupo.tipoId,
        name: formName.trim(),
        description: formDesc.trim(),
      });
    } else {
      const code = generateNextSubgrupoCode(grupo, subgrupos);
      const newSub: Subgrupo = {
        id: 'sub_' + Date.now(),
        grupoId: selectedGrupoId,
        tipoId: grupo.tipoId,
        code,
        name: formName.trim(),
        description: formDesc.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddSubgrupo(newSub);
      setExpandedSubgrupos((prev) => ({ ...prev, [newSub.id]: true }));
    }
    setActiveModal(null);
  };

  const handleSaveArtigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !selectedSubgrupoId) return;

    const sub = subgrupos.find((s) => s.id === selectedSubgrupoId);
    if (!sub) return;

    if (editingItem) {
      onUpdateArtigo({
        ...editingItem,
        name: formName.trim(),
        subgrupoId: selectedSubgrupoId,
        grupoId: sub.grupoId,
        tipoId: sub.tipoId,
        unit: artUnit,
        minStock: Number(artMinStock),
        maxStock: Number(artMaxStock),
        unitCost: Number(artCost),
        defaultLocationId: artLocationId || undefined,
        specification: artSpec.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const { code, hierarchicalCode, barcode } = generateNextArtigoCodes(sub, artigos);
      const newArt: Artigo = {
        id: 'art_' + Date.now(),
        code,
        hierarchicalCode,
        name: formName.trim(),
        tipoId: sub.tipoId,
        grupoId: sub.grupoId,
        subgrupoId: sub.id,
        unit: artUnit,
        minStock: Number(artMinStock),
        maxStock: Number(artMaxStock),
        currentStock: Number(artInitialStock),
        unitCost: Number(artCost),
        defaultLocationId: artLocationId || undefined,
        specification: artSpec.trim(),
        barcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddArtigo(newArt);
    }
    setActiveModal(null);
  };

  // Preview de código do novo item no formulário
  const previewTipoCode = generateNextTipoCode(tipos);
  const currentSelectedTipo = tipos.find((t) => t.id === selectedTipoId);
  const previewGrupoCode = currentSelectedTipo ? generateNextGrupoCode(currentSelectedTipo, grupos) : '---';
  const currentSelectedGrupo = grupos.find((g) => g.id === selectedGrupoId);
  const previewSubgrupoCode = currentSelectedGrupo ? generateNextSubgrupoCode(currentSelectedGrupo, subgrupos) : '---';
  const currentSelectedSub = subgrupos.find((s) => s.id === selectedSubgrupoId);
  const previewArtigoCodes = currentSelectedSub ? generateNextArtigoCodes(currentSelectedSub, artigos) : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-white border-b border-gray-200 p-5 rounded-lg shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#E30613] font-bold text-xs uppercase tracking-wider">
            <GitFork className="w-4 h-4" />
            <span>Nível 1 a 4 • Classificação Padronizada</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Cadastro Hierárquico do Almoxarifado
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Estrutura obrigatória: <strong>Tipo → Grupo → Subgrupo → Artigo</strong>. Códigos únicos gerados automaticamente.
          </p>
        </div>

        {/* Botões Rápidos de Adição de Nível */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openNewTipoModal}
            className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-3 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tipo (Nível 1)</span>
          </button>

          <button
            onClick={() => openNewGrupoModal()}
            disabled={tipos.length === 0}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded shadow cursor-pointer transition-colors ${
              tipos.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Grupo (Nível 2)</span>
          </button>

          <button
            onClick={() => openNewSubgrupoModal()}
            disabled={grupos.length === 0}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded shadow cursor-pointer transition-colors ${
              grupos.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Subgrupo (Nível 3)</span>
          </button>

          <button
            onClick={() => openNewArtigoModal()}
            disabled={subgrupos.length === 0}
            className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded shadow cursor-pointer transition-colors ${
              subgrupos.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-gray-100 text-neutral-900 border border-gray-300'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#E30613]" />
            <span>+ Artigo (Nível 4)</span>
          </button>
        </div>
      </div>

      {/* Árvore Hierárquica Interativa */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-5 h-5 text-[#E30613]" />
            <h3 className="font-bold text-sm">Árvore de Classificação de Materiais</h3>
          </div>

          {/* Campo de Busca Rápida na Árvore */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-800 text-white text-xs pl-8 pr-3 py-1.5 rounded border border-neutral-700 focus:outline-none focus:border-[#E30613] w-full"
            />
          </div>
        </div>

        {/* Listagem em Árvore */}
        <div className="p-4 divide-y divide-gray-100">
          {tipos.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-neutral-800 text-base">Nenhum Tipo cadastrado ainda.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Comece criando o primeiro Tipo (Nível 1), como por exemplo "Matéria-Prima", "Ferramental" ou "EPIs".
              </p>
              <button
                onClick={openNewTipoModal}
                className="mt-4 inline-flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-4 py-2 rounded shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Tipo</span>
              </button>
            </div>
          ) : (
            tipos
              .filter(
                (t) =>
                  !searchTerm ||
                  t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.code.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((tipo) => {
                const isTipoExpanded = expandedTipos[tipo.id] ?? true;
                const tipoGrupos = grupos.filter((g) => g.tipoId === tipo.id);

                return (
                  <div key={tipo.id} className="py-3">
                    {/* Linha do NÍVEL 1: TIPO */}
                    <div className="flex items-center justify-between p-2 rounded bg-neutral-100 border border-gray-200 hover:border-gray-400 transition-colors">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleTipo(tipo.id)}
                          className="p-1 hover:bg-gray-200 rounded cursor-pointer text-gray-600"
                        >
                          {isTipoExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="bg-[#E30613] text-white font-mono font-bold text-xs px-2 py-0.5 rounded shadow-xs">
                          {tipo.code}
                        </span>
                        <span className="font-bold text-neutral-900 text-sm">{tipo.name}</span>
                        {tipo.description && (
                          <span className="text-xs text-gray-500 hidden md:inline">— {tipo.description}</span>
                        )}
                        <span className="text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {tipoGrupos.length} grupos
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => openNewGrupoModal(tipo.id)}
                          className="text-xs bg-white hover:bg-neutral-50 text-neutral-800 border border-gray-300 px-2 py-1 rounded font-semibold cursor-pointer"
                          title="Adicionar Grupo pertencente a este Tipo"
                        >
                          + Grupo
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(tipo);
                            setFormName(tipo.name);
                            setFormDesc(tipo.description || '');
                            setActiveModal('tipo');
                          }}
                          className="p-1 text-gray-500 hover:text-neutral-900 cursor-pointer"
                          title="Editar Tipo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (tipoGrupos.length > 0) {
                              alert('Não é possível excluir este Tipo pois ele possui Grupos vinculados. Remova os Grupos primeiro.');
                              return;
                            }
                            if (confirm(`Deseja excluir o Tipo ${tipo.name}?`)) {
                              onDeleteTipo(tipo.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Excluir Tipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* GRUPOS VINCULADOS (NÍVEL 2) */}
                    {isTipoExpanded && (
                      <div className="ml-6 pl-4 border-l-2 border-red-200 mt-2 space-y-2">
                        {tipoGrupos.length === 0 ? (
                          <div className="text-xs text-gray-400 py-2 italic flex items-center justify-between">
                            <span>Nenhum Grupo neste Tipo.</span>
                            <button
                              onClick={() => openNewGrupoModal(tipo.id)}
                              className="text-[#E30613] font-semibold hover:underline cursor-pointer"
                            >
                              + Adicionar Grupo agora
                            </button>
                          </div>
                        ) : (
                          tipoGrupos.map((grupo) => {
                            const isGrupoExpanded = expandedGrupos[grupo.id] ?? true;
                            const grupoSubgrupos = subgrupos.filter((s) => s.grupoId === grupo.id);

                            return (
                              <div key={grupo.id} className="pt-1">
                                {/* Linha do NÍVEL 2: GRUPO */}
                                <div className="flex items-center justify-between p-1.5 rounded bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleGrupo(grupo.id)}
                                      className="p-1 hover:bg-gray-200 rounded cursor-pointer text-gray-500"
                                    >
                                      {isGrupoExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <span className="bg-neutral-800 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                                      {grupo.code}
                                    </span>
                                    <span className="font-semibold text-neutral-800 text-xs sm:text-sm">
                                      {grupo.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                                      {grupoSubgrupos.length} subgrupos
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => openNewSubgrupoModal(grupo.id, tipo.id)}
                                      className="text-xs bg-white hover:bg-neutral-50 text-neutral-800 border border-gray-300 px-2 py-0.5 rounded font-medium cursor-pointer"
                                      title="Adicionar Subgrupo pertencente a este Grupo"
                                    >
                                      + Subgrupo
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingItem(grupo);
                                        setSelectedTipoId(grupo.tipoId);
                                        setFormName(grupo.name);
                                        setFormDesc(grupo.description || '');
                                        setActiveModal('grupo');
                                      }}
                                      className="p-1 text-gray-400 hover:text-neutral-900 cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (grupoSubgrupos.length > 0) {
                                          alert('Não é possível excluir este Grupo pois possui Subgrupos vinculados.');
                                          return;
                                        }
                                        if (confirm(`Deseja excluir o Grupo ${grupo.name}?`)) {
                                          onDeleteGrupo(grupo.id);
                                        }
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* SUBGRUPOS VINCULADOS (NÍVEL 3) */}
                                {isGrupoExpanded && (
                                  <div className="ml-6 pl-3 border-l-2 border-neutral-300 mt-1.5 space-y-1.5">
                                    {grupoSubgrupos.length === 0 ? (
                                      <div className="text-xs text-gray-400 py-1.5 italic flex items-center justify-between">
                                        <span>Nenhum Subgrupo neste Grupo.</span>
                                        <button
                                          onClick={() => openNewSubgrupoModal(grupo.id, tipo.id)}
                                          className="text-neutral-700 font-semibold hover:underline cursor-pointer"
                                        >
                                          + Adicionar Subgrupo
                                        </button>
                                      </div>
                                    ) : (
                                      grupoSubgrupos.map((sub) => {
                                        const isSubExpanded = expandedSubgrupos[sub.id] ?? true;
                                        const subArtigos = artigos.filter((a) => a.subgrupoId === sub.id);

                                        return (
                                          <div key={sub.id} className="pt-0.5">
                                            {/* Linha do NÍVEL 3: SUBGRUPO */}
                                            <div className="flex items-center justify-between p-1 rounded bg-white border border-gray-200 hover:border-gray-300 text-xs">
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={() => toggleSubgrupo(sub.id)}
                                                  className="p-0.5 hover:bg-gray-100 rounded cursor-pointer text-gray-500"
                                                >
                                                  {isSubExpanded ? (
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                  ) : (
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                  )}
                                                </button>
                                                <span className="bg-neutral-200 text-neutral-800 font-mono font-bold px-1.5 py-0.5 rounded text-[11px]">
                                                  {sub.code}
                                                </span>
                                                <span className="font-medium text-neutral-900">{sub.name}</span>
                                                <span className="text-[10px] text-gray-500 bg-gray-50 px-1 py-0.2 rounded border">
                                                  {subArtigos.length} artigos
                                                </span>
                                              </div>

                                              <div className="flex items-center space-x-1.5">
                                                <button
                                                  onClick={() => openNewArtigoModal(sub.id)}
                                                  className="text-[11px] bg-red-50 hover:bg-red-100 text-[#E30613] border border-red-200 px-2 py-0.5 rounded font-bold cursor-pointer"
                                                  title="Cadastrar Artigo neste Subgrupo"
                                                >
                                                  + Artigo
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingItem(sub);
                                                    setSelectedGrupoId(sub.grupoId);
                                                    setFormName(sub.name);
                                                    setFormDesc(sub.description || '');
                                                    setActiveModal('subgrupo');
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-neutral-900 cursor-pointer"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    if (subArtigos.length > 0) {
                                                      alert('Não é possível excluir este Subgrupo pois possui Artigos vinculados.');
                                                      return;
                                                    }
                                                    if (confirm(`Deseja excluir o Subgrupo ${sub.name}?`)) {
                                                      onDeleteSubgrupo(sub.id);
                                                    }
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* ARTIGOS (NÍVEL 4) */}
                                            {isSubExpanded && (
                                              <div className="ml-6 pl-3 border-l-2 border-emerald-300 mt-1 space-y-1">
                                                {subArtigos.length === 0 ? (
                                                  <div className="text-[11px] text-gray-400 py-1 italic">
                                                    Nenhum artigo cadastrado neste subgrupo.
                                                  </div>
                                                ) : (
                                                  subArtigos.map((art) => {
                                                    const loc = localizacoes.find(
                                                      (l) => l.id === art.defaultLocationId
                                                    );
                                                    const isLow = art.currentStock <= art.minStock;

                                                    return (
                                                      <div
                                                        key={art.id}
                                                        className="flex items-center justify-between p-1.5 rounded bg-gray-50/70 border border-gray-200 hover:bg-white text-xs transition-colors"
                                                      >
                                                        <div className="flex items-center space-x-2.5">
                                                          <Package className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                                          <div>
                                                            <div className="font-semibold text-neutral-900 flex items-center gap-2">
                                                              <span>{art.name}</span>
                                                              <span className="font-mono text-[10px] bg-white border border-gray-300 px-1 py-0.2 rounded text-gray-600">
                                                                {art.hierarchicalCode}
                                                              </span>
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                                              <span className="font-mono font-bold text-gray-700">
                                                                {art.code}
                                                              </span>
                                                              <span>•</span>
                                                              <span>Unid: {art.unit}</span>
                                                              <span>•</span>
                                                              <span>
                                                                Custo:{' '}
                                                                {art.unitCost.toLocaleString('pt-BR', {
                                                                  style: 'currency',
                                                                  currency: 'BRL',
                                                                })}
                                                              </span>
                                                              {loc && (
                                                                <>
                                                                  <span>•</span>
                                                                  <span className="flex items-center gap-0.5 text-gray-600">
                                                                    <MapPin className="w-3 h-3 text-[#E30613]" />
                                                                    {loc.almoxarifado} ({loc.corredor} / {loc.estante})
                                                                  </span>
                                                                </>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>

                                                        <div className="flex items-center space-x-3">
                                                          <div className="text-right">
                                                            <div
                                                              className={`font-mono font-bold text-xs ${
                                                                isLow ? 'text-[#E30613]' : 'text-neutral-900'
                                                              }`}
                                                            >
                                                              {art.currentStock} {art.unit}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                              Mín: {art.minStock} | Máx: {art.maxStock}
                                                            </div>
                                                          </div>

                                                          <div className="flex items-center space-x-1">
                                                            <button
                                                              onClick={() => {
                                                                setEditingItem(art);
                                                                setSelectedSubgrupoId(art.subgrupoId);
                                                                setSelectedGrupoId(art.grupoId);
                                                                setSelectedTipoId(art.tipoId);
                                                                setFormName(art.name);
                                                                setArtUnit(art.unit);
                                                                setArtMinStock(art.minStock);
                                                                setArtMaxStock(art.maxStock);
                                                                setArtCost(art.unitCost);
                                                                setArtLocationId(art.defaultLocationId || '');
                                                                setArtSpec(art.specification || '');
                                                                setActiveModal('artigo');
                                                              }}
                                                              className="p-1 text-gray-400 hover:text-neutral-900 cursor-pointer"
                                                            >
                                                              <Edit2 className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                if (
                                                                  confirm(
                                                                    `Deseja realmente excluir o Artigo "${art.name}" (${art.code})?`
                                                                  )
                                                                ) {
                                                                  onDeleteArtigo(art.id);
                                                                }
                                                              }}
                                                              className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                                            >
                                                              <Trash2 className="w-3 h-3" />
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR TIPO (NÍVEL 1) */}
      {/* ========================================================= */}
      {activeModal === 'tipo' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#E30613] text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span>{editingItem ? 'Editar Tipo (Nível 1)' : 'Novo Tipo de Material (Nível 1)'}</span>
              <button onClick={() => setActiveModal(null)} className="text-white hover:text-gray-200 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTipo} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Código Único Automático</label>
                <div className="bg-gray-100 border border-gray-300 font-mono font-bold text-neutral-800 px-3 py-2 rounded flex items-center justify-between">
                  <span>{editingItem ? editingItem.code : previewTipoCode}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Gerado pelo Sistema</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Nome do Tipo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Matéria-Prima, Ferramentas, EPIs, Elétrica..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre a categoria de materiais..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E30613] hover:bg-[#c4000f] text-white rounded font-bold cursor-pointer shadow"
                >
                  {editingItem ? 'Salvar Alterações' : 'Criar Tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR GRUPO (NÍVEL 2) */}
      {/* ========================================================= */}
      {activeModal === 'grupo' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="bg-neutral-900 text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span>{editingItem ? 'Editar Grupo (Nível 2)' : 'Novo Grupo (Nível 2)'}</span>
              <button onClick={() => setActiveModal(null)} className="text-white hover:text-gray-200 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrupo} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Tipo Pai (Nível 1) <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedTipoId}
                  onChange={(e) => setSelectedTipoId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#E30613]"
                  required
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} — {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Código Gerado</label>
                <div className="bg-gray-100 border border-gray-300 font-mono font-bold text-neutral-800 px-3 py-2 rounded flex items-center justify-between">
                  <span>{editingItem ? editingItem.code : previewGrupoCode}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Hierárquico</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Nome do Grupo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aços Carbono, Brocas, Sensores..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Observações do grupo..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer shadow"
                >
                  {editingItem ? 'Salvar Alterações' : 'Criar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR SUBGRUPO (NÍVEL 3) */}
      {/* ========================================================= */}
      {activeModal === 'subgrupo' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="bg-neutral-900 text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span>{editingItem ? 'Editar Subgrupo (Nível 3)' : 'Novo Subgrupo (Nível 3)'}</span>
              <button onClick={() => setActiveModal(null)} className="text-white hover:text-gray-200 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubgrupo} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Grupo Pai (Nível 2) <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedGrupoId}
                  onChange={(e) => setSelectedGrupoId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#E30613]"
                  required
                >
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Código Gerado</label>
                <div className="bg-gray-100 border border-gray-300 font-mono font-bold text-neutral-800 px-3 py-2 rounded flex items-center justify-between">
                  <span>{editingItem ? editingItem.code : previewSubgrupoCode}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Hierárquico</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Nome do Subgrupo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barras Laminadas, Brocas HSS, Óculos..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Especificação geral do subgrupo..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer shadow"
                >
                  {editingItem ? 'Salvar Alterações' : 'Criar Subgrupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR ARTIGO (NÍVEL 4) */}
      {/* ========================================================= */}
      {activeModal === 'artigo' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden border border-gray-300 my-8">
            <div className="bg-[#E30613] text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>{editingItem ? 'Editar Artigo de Estoque' : 'Novo Artigo / Item de Estoque (Nível 4)'}</span>
              </span>
              <button onClick={() => setActiveModal(null)} className="text-white hover:text-gray-200 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArtigo} className="p-5 space-y-4 text-xs sm:text-sm">
              {/* Seleção do Subgrupo Pai */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Subgrupo de Classificação <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedSubgrupoId}
                  onChange={(e) => setSelectedSubgrupoId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#E30613]"
                  required
                >
                  {subgrupos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Códigos Únicos Gerados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600">Código Único do Artigo</label>
                  <div className="font-mono font-bold text-neutral-900 text-sm mt-0.5">
                    {editingItem ? editingItem.code : previewArtigoCodes?.code}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600">Código Hierárquico Completo</label>
                  <div className="font-mono font-bold text-[#E30613] text-sm mt-0.5">
                    {editingItem ? editingItem.hierarchicalCode : previewArtigoCodes?.hierarchicalCode}
                  </div>
                </div>
              </div>

              {/* Nome do Artigo */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Descrição Completa do Artigo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Broca HSS DIN 338 Ø 8.00mm, Barra Redonda Aço 1045..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              {/* Unidade, Custo, Estoque Mínimo e Máximo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Unidade</label>
                  <select
                    value={artUnit}
                    onChange={(e) => setArtUnit(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="PC">PC (Peça)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="M">M (Metro)</option>
                    <option value="L">L (Litro)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="RL">RL (Rolo)</option>
                    <option value="PAR">PAR (Par)</option>
                    <option value="KIT">KIT (Conjunto)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Custo Médio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={artCost}
                    onChange={(e) => setArtCost(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={artMinStock}
                    onChange={(e) => setArtMinStock(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Estoque Máximo</label>
                  <input
                    type="number"
                    min="0"
                    value={artMaxStock}
                    onChange={(e) => setArtMaxStock(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Se for novo artigo, permite definir saldo inicial */}
              {!editingItem && (
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <label className="block font-bold text-amber-900 mb-1">
                    Saldo Inicial para Testes (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={artInitialStock}
                    onChange={(e) => setArtInitialStock(Number(e.target.value))}
                    placeholder="0 para iniciar sem estoque"
                    className="w-full border border-amber-300 rounded px-3 py-1.5 bg-white font-mono"
                  />
                  <p className="text-[10px] text-amber-800 mt-1">
                    * Você também pode iniciar com 0 e registrar as entradas através do menu "Movimentações" com NF.
                  </p>
                </div>
              )}

              {/* Localização Padrão */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Localização Padrão de Armazenamento
                </label>
                <select
                  value={artLocationId}
                  onChange={(e) => setArtLocationId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">-- Não especificada / A definir --</option>
                  {localizacoes.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.almoxarifado} ({loc.corredor} / {loc.estante} / {loc.nivel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Especificação Técnica */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Especificações Técnicas / Aplicação SENAI</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Utilizado na disciplina de Tornearia Mecânica do curso Técnico de Mecatrônica..."
                  value={artSpec}
                  onChange={(e) => setArtSpec(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E30613] hover:bg-[#c4000f] text-white rounded font-bold cursor-pointer shadow"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Artigo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
