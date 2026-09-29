import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Package,
  Layers,
  Search,
  CheckCircle,
} from 'lucide-react';
import { Location, Artigo } from '../types/inventory';
import { generateNextLocationCode } from '../services/storageService';

interface LocationsViewProps {
  localizacoes: Location[];
  artigos: Artigo[];
  onAddLocation: (location: Location) => void;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (id: string) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  localizacoes,
  artigos,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  // Form states
  const [almo, setAlmo] = useState('Almoxarifado Central (Prédio A)');
  const [corredor, setCorredor] = useState('Rua 01');
  const [estante, setEstante] = useState('Estante 01');
  const [nivel, setNivel] = useState('Nível 01');
  const [gaveta, setGaveta] = useState('Box 01');
  const [desc, setDesc] = useState('');

  const openNewLocationModal = () => {
    setEditingLoc(null);
    setAlmo('Almoxarifado Central (Prédio A)');
    setCorredor('Rua 01');
    setEstante('Estante 01');
    setNivel('Nível 01');
    setGaveta('Box 01');
    setDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setAlmo(loc.almoxarifado);
    setCorredor(loc.corredor);
    setEstante(loc.estante);
    setNivel(loc.nivel);
    setGaveta(loc.gaveta || '');
    setDesc(loc.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!almo.trim() || !corredor.trim() || !estante.trim() || !nivel.trim()) return;

    if (editingLoc) {
      onUpdateLocation({
        ...editingLoc,
        almoxarifado: almo.trim(),
        corredor: corredor.trim(),
        estante: estante.trim(),
        nivel: nivel.trim(),
        gaveta: gaveta.trim() || undefined,
        description: desc.trim() || undefined,
      });
    } else {
      const code = generateNextLocationCode(almo, corredor, estante, nivel, localizacoes);
      const newLoc: Location = {
        id: 'loc_' + Date.now(),
        code,
        almoxarifado: almo.trim(),
        corredor: corredor.trim(),
        estante: estante.trim(),
        nivel: nivel.trim(),
        gaveta: gaveta.trim() || undefined,
        description: desc.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddLocation(newLoc);
    }
    setIsModalOpen(false);
  };

  const filteredLocations = localizacoes.filter((loc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      loc.code.toLowerCase().includes(term) ||
      loc.almoxarifado.toLowerCase().includes(term) ||
      loc.corredor.toLowerCase().includes(term) ||
      loc.estante.toLowerCase().includes(term) ||
      loc.nivel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#E30613] font-bold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Endereçamento Físico • Galpões e Prateleiras</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Localizações de Armazenamento
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Identificação física de Almoxarifados, Corredores, Estantes, Níveis e Gaveteiros.
          </p>
        </div>

        <button
          onClick={openNewLocationModal}
          className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-4 py-2 rounded shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Localização</span>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por almoxarifado, corredor, estante, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#E30613] focus:bg-white"
          />
        </div>
      </div>

      {/* Grid de Localizações */}
      {localizacoes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center text-gray-500 shadow-sm">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-neutral-800 text-base">Nenhuma localização física cadastrada.</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Cadastre os galpões, corredores e prateleiras para mapear onde cada artigo está guardado no almoxarifado.
          </p>
          <button
            onClick={openNewLocationModal}
            className="mt-4 inline-flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] text-white text-xs font-bold px-4 py-2 rounded shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Localização</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const artigosAqui = artigos.filter((a) => a.defaultLocationId === loc.id);

            return (
              <div
                key={loc.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-[#E30613] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                      {loc.code}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1 text-gray-400 hover:text-neutral-900 cursor-pointer"
                        title="Editar Localização"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (artigosAqui.length > 0) {
                            alert(
                              `Esta localização possui ${artigosAqui.length} artigo(s) vinculados. Altere o local dos artigos antes de excluir.`
                            );
                            return;
                          }
                          if (confirm(`Deseja excluir a localização ${loc.code}?`)) {
                            onDeleteLocation(loc.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                        title="Excluir Localização"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-neutral-900 text-sm mt-2">{loc.almoxarifado}</h3>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs bg-gray-50 p-2.5 rounded border border-gray-100">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Corredor / Rua:</span>
                      <span className="font-semibold text-neutral-800">{loc.corredor}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Estante / Rack:</span>
                      <span className="font-semibold text-neutral-800">{loc.estante}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Nível / Prateleira:</span>
                      <span className="font-semibold text-neutral-800">{loc.nivel}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Gaveta / Box:</span>
                      <span className="font-semibold text-neutral-800">{loc.gaveta || '---'}</span>
                    </div>
                  </div>

                  {loc.description && (
                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{loc.description}</p>
                  )}
                </div>

                {/* Artigos armazenados nesta localização */}
                <div className="pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#E30613]" />
                      <span>Artigos Vinculados:</span>
                    </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded font-bold text-neutral-800">
                      {artigosAqui.length}
                    </span>
                  </div>

                  {artigosAqui.length === 0 ? (
                    <div className="text-[10px] text-gray-400 italic">Nenhum artigo alocado aqui atualmente.</div>
                  ) : (
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {artigosAqui.slice(0, 3).map((a) => (
                        <div key={a.id} className="text-[10px] text-neutral-700 truncate flex justify-between">
                          <span className="font-medium">• {a.name}</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {a.currentStock} {a.unit}
                          </span>
                        </div>
                      ))}
                      {artigosAqui.length > 3 && (
                        <div className="text-[10px] text-gray-400 italic">
                          + {artigosAqui.length - 3} outro(s) artigo(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Localização */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="bg-[#E30613] text-white px-5 py-3 flex items-center justify-between font-bold text-sm">
              <span>{editingLoc ? 'Editar Localização Física' : 'Nova Localização de Armazenamento'}</span>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Almoxarifado / Galpão <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoxarifado Central (Prédio A), Depósito B..."
                  value={almo}
                  onChange={(e) => setAlmo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Corredor / Rua <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rua 01, Corredor B"
                    value={corredor}
                    onChange={(e) => setCorredor(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Estante / Porta-Palete <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Estante 03, Rack 2"
                    value={estante}
                    onChange={(e) => setEstante(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Nível / Prateleira <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nível 02, Prateleira C"
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Gaveta / Box (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Gaveta 04, Box 12"
                    value={gaveta}
                    onChange={(e) => setGaveta(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Observações de Armazenamento</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Armazenamento exclusivo para ferramentas rotativas pesadas..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E30613] hover:bg-[#c4000f] text-white rounded font-bold cursor-pointer shadow"
                >
                  {editingLoc ? 'Salvar Alterações' : 'Criar Localização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
