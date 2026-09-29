import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Artigo, Location, Movement, MovementType } from '../types/inventory';
import { generateDocumentNumber, TECHNICAL_MANAGER_NAME } from '../services/storageService';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: MovementType;
  defaultArtigoId?: string;
  artigos: Artigo[];
  localizacoes: Location[];
  onSaveMovement: (movement: Movement) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  defaultType,
  defaultArtigoId,
  artigos,
  localizacoes,
  onSaveMovement,
}) => {
  const [type, setType] = useState<MovementType>(defaultType);
  const [artigoId, setArtigoId] = useState<string>(defaultArtigoId || artigos[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [originOrDestination, setOriginOrDestination] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [operator, setOperator] = useState<string>(TECHNICAL_MANAGER_NAME);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sincronizar quando abrir
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      const selectedArt = artigos.find((a) => a.id === defaultArtigoId) || artigos[0];
      if (selectedArt) {
        setArtigoId(selectedArt.id);
        setUnitCost(selectedArt.unitCost);
        setLocationId(selectedArt.defaultLocationId || localizacoes[0]?.id || '');
      }
      setDocumentNumber(generateDocumentNumber(defaultType === 'SAIDA' ? 'SAIDA' : 'ENTRADA'));
      setQuantity(1);
      setValidationError(null);

      if (defaultType === 'ENTRADA') {
        setReason('Compra / Recebimento de Suprimentos');
        setOriginOrDestination('');
      } else {
        setReason('Aula Prática SENAI');
        setOriginOrDestination('Turma Técnica SENAI SP');
      }
    }
  }, [isOpen, defaultType, defaultArtigoId, artigos, localizacoes]);

  // Atualizar dados ao mudar o artigo
  const handleArtigoChange = (newArtigoId: string) => {
    setArtigoId(newArtigoId);
    const art = artigos.find((a) => a.id === newArtigoId);
    if (art) {
      setUnitCost(art.unitCost);
      if (art.defaultLocationId) {
        setLocationId(art.defaultLocationId);
      }
    }
    setValidationError(null);
  };

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    setDocumentNumber(generateDocumentNumber(newType === 'SAIDA' ? 'SAIDA' : 'ENTRADA'));
    if (newType === 'ENTRADA') {
      setReason('Compra / Recebimento de Suprimentos');
    } else {
      setReason('Aula Prática SENAI');
    }
    setValidationError(null);
  };

  if (!isOpen) return null;

  const currentArtigo = artigos.find((a) => a.id === artigoId);
  const isSaida = type === 'SAIDA';
  const availableStock = currentArtigo ? currentArtigo.currentStock : 0;
  const resultingStock = currentArtigo
    ? isSaida
      ? availableStock - Number(quantity)
      : availableStock + Number(quantity)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArtigo) {
      setValidationError('Selecione um artigo válido.');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setValidationError('A quantidade deve ser maior que zero.');
      return;
    }

    if (isSaida && qty > availableStock) {
      setValidationError(
        `Quantidade de saída (${qty}) é superior ao saldo disponível em estoque (${availableStock} ${currentArtigo.unit}).`
      );
      return;
    }

    const selectedLoc = localizacoes.find((l) => l.id === locationId);
    const locDisplay = selectedLoc
      ? `${selectedLoc.almoxarifado} > ${selectedLoc.corredor} > ${selectedLoc.estante} (${selectedLoc.nivel})`
      : undefined;

    const newMovement: Movement = {
      id: 'mov_' + Date.now(),
      type,
      artigoId: currentArtigo.id,
      artigoName: currentArtigo.name,
      artigoCode: currentArtigo.code,
      hierarchicalCode: currentArtigo.hierarchicalCode,
      quantity: qty,
      unitCost: Number(unitCost),
      totalValue: qty * Number(unitCost),
      previousStock: availableStock,
      newStock: resultingStock,
      documentNumber: documentNumber.trim() || generateDocumentNumber(isSaida ? 'SAIDA' : 'ENTRADA'),
      reason: reason.trim() || (isSaida ? 'Consumo Oficina' : 'Entrada Nota Fiscal'),
      originOrDestination: originOrDestination.trim() || (isSaida ? 'Oficina SENAI' : 'Fornecedor'),
      locationId: locationId || undefined,
      locationDisplay: locDisplay,
      operator: operator.trim() || TECHNICAL_MANAGER_NAME,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    onSaveMovement(newMovement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full overflow-hidden border border-gray-300 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div
          className={`px-5 py-3.5 text-white flex items-center justify-between font-bold text-sm ${
            isSaida ? 'bg-neutral-900' : 'bg-[#E30613]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isSaida ? (
              <ArrowUpRight className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            ) : (
              <ArrowDownLeft className="w-5 h-5 text-white stroke-[2.5]" />
            )}
            <span>
              {isSaida ? 'Registrar Saída de Material (Requisição/OS)' : 'Registrar Entrada de Material (Recebimento)'}
            </span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Alternador de Tipo (Entrada vs Saída) */}
        <div className="p-3 bg-gray-100 border-b border-gray-200 flex space-x-2 text-xs">
          <button
            type="button"
            onClick={() => handleTypeChange('ENTRADA')}
            className={`flex-1 py-2 font-bold rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              !isSaida
                ? 'bg-[#E30613] text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Entrada de Material</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('SAIDA')}
            className={`flex-1 py-2 font-bold rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              isSaida
                ? 'bg-neutral-900 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            <span>- Saída de Material</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Alerta de Validação */}
          {validationError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Seleção do Artigo */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1">
              Artigo / Material <span className="text-red-600">*</span>
            </label>
            {artigos.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                Nenhum artigo cadastrado ainda. Cadastre um artigo antes de registrar movimentações.
              </div>
            ) : (
              <select
                value={artigoId}
                onChange={(e) => handleArtigoChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#E30613]"
                required
              >
                {artigos.map((art) => (
                  <option key={art.id} value={art.id}>
                    [{art.code}] {art.name} (Saldo: {art.currentStock} {art.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cartão de Saldo Atual e Saldo Resultante */}
          {currentArtigo && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">Saldo Atual:</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  {currentArtigo.currentStock} {currentArtigo.unit}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">{isSaida ? 'Retirada:' : 'Acréscimo:'}</span>
                <span
                  className={`font-mono font-bold text-sm ${isSaida ? 'text-amber-700' : 'text-emerald-700'}`}
                >
                  {isSaida ? '-' : '+'}
                  {quantity || 0} {currentArtigo.unit}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Saldo Previsto:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    resultingStock < 0
                      ? 'text-red-600 animate-pulse'
                      : resultingStock <= currentArtigo.minStock
                      ? 'text-[#E30613]'
                      : 'text-neutral-900'
                  }`}
                >
                  {resultingStock} {currentArtigo.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantidade e Custo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">
                Quantidade Movimentada <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#E30613]"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 mb-1">
                {isSaida ? 'Custo de Saída (R$)' : 'Custo Unitário de Entrada (R$)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-neutral-900 focus:outline-none focus:border-[#E30613]"
              />
            </div>
          </div>

          {/* Documento e Origem/Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">
                N° do Documento / Comprovante <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isSaida ? 'Ex: OS-2026-001, REQ-81' : 'Ex: NF-10482, Guia 44'}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#E30613]"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 mb-1">
                {isSaida ? 'Destino / Solicitante / Turma SENAI' : 'Fornecedor / Remetente'}
              </label>
              <input
                type="text"
                required
                placeholder={isSaida ? 'Ex: Turma Mecatrônica Tarde, Oficina' : 'Ex: Gerdau Aços, Tramontina'}
                value={originOrDestination}
                onChange={(e) => setOriginOrDestination(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#E30613]"
              />
            </div>
          </div>

          {/* Motivo e Localização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">Motivo da Movimentação</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isSaida ? 'Ex: Aula Prática, Manutenção, Teste' : 'Ex: Compra Anual, Devolução'}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 mb-1">
                Localização Física ({isSaida ? 'Origem' : 'Destino'})
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              >
                <option value="">-- Padrão do Cadastro --</option>
                {localizacoes.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} — {loc.almoxarifado} ({loc.corredor} / {loc.estante})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operador / Responsável Técnico */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1">Operador / Responsável pelo Registro</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1">Observações Adicionais</label>
            <input
              type="text"
              placeholder="Notas de conformidade, lote ou detalhes da peça..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Rodapé com botões de ação */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-neutral-700 hover:bg-gray-100 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={artigos.length === 0}
              className={`px-5 py-2 text-white rounded font-bold cursor-pointer shadow transition-all ${
                isSaida
                  ? 'bg-neutral-900 hover:bg-neutral-800'
                  : 'bg-[#E30613] hover:bg-[#c4000f]'
              }`}
            >
              {isSaida ? 'Confirmar Saída' : 'Confirmar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
