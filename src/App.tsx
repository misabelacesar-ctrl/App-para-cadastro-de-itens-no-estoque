/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  InventoryDatabase,
  Tipo,
  Grupo,
  Subgrupo,
  Artigo,
  Location,
  Movement,
  MovementType,
  GitHubSyncConfig,
} from './types/inventory';
import {
  loadDatabase,
  saveDatabase,
  getEmptyDatabase,
  getDemoDatabase,
} from './services/storageService';
import { Header } from './components/Header';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { HierarchyView } from './components/HierarchyView';
import { StockPositionView } from './components/StockPositionView';
import { MovementView } from './components/MovementView';
import { MovementModal } from './components/MovementModal';
import { LocationsView } from './components/LocationsView';
import { ReportsView } from './components/ReportsView';
import { CloudSyncView } from './components/CloudSyncView';
import { Footer } from './components/Footer';

export default function App() {
  const [database, setDatabase] = useState<InventoryDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Estado do Modal de Movimentação (+ Entrada / - Saída)
  const [movementModal, setMovementModal] = useState<{
    isOpen: boolean;
    defaultType: MovementType;
    defaultArtigoId?: string;
  }>({
    isOpen: false,
    defaultType: 'ENTRADA',
  });

  // Salvar sempre que o banco for alterado
  useEffect(() => {
    saveDatabase(database);
  }, [database]);

  // Contadores
  const criticosCount = database.artigos.filter((a) => a.currentStock <= a.minStock).length;

  // -------------------------------------------------------------
  // HANDLERS DE CADASTRO HIERÁRQUICO
  // -------------------------------------------------------------

  const handleAddTipo = (tipo: Tipo) => {
    setDatabase((prev) => ({
      ...prev,
      tipos: [...prev.tipos, tipo],
    }));
  };

  const handleUpdateTipo = (tipo: Tipo) => {
    setDatabase((prev) => ({
      ...prev,
      tipos: prev.tipos.map((t) => (t.id === tipo.id ? tipo : t)),
    }));
  };

  const handleDeleteTipo = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      tipos: prev.tipos.filter((t) => t.id !== id),
    }));
  };

  const handleAddGrupo = (grupo: Grupo) => {
    setDatabase((prev) => ({
      ...prev,
      grupos: [...prev.grupos, grupo],
    }));
  };

  const handleUpdateGrupo = (grupo: Grupo) => {
    setDatabase((prev) => ({
      ...prev,
      grupos: prev.grupos.map((g) => (g.id === grupo.id ? grupo : g)),
    }));
  };

  const handleDeleteGrupo = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      grupos: prev.grupos.filter((g) => g.id !== id),
    }));
  };

  const handleAddSubgrupo = (subgrupo: Subgrupo) => {
    setDatabase((prev) => ({
      ...prev,
      subgrupos: [...prev.subgrupos, subgrupo],
    }));
  };

  const handleUpdateSubgrupo = (subgrupo: Subgrupo) => {
    setDatabase((prev) => ({
      ...prev,
      subgrupos: prev.subgrupos.map((s) => (s.id === subgrupo.id ? subgrupo : s)),
    }));
  };

  const handleDeleteSubgrupo = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      subgrupos: prev.subgrupos.filter((s) => s.id !== id),
    }));
  };

  const handleAddArtigo = (artigo: Artigo) => {
    setDatabase((prev) => ({
      ...prev,
      artigos: [...prev.artigos, artigo],
    }));
  };

  const handleUpdateArtigo = (artigo: Artigo) => {
    setDatabase((prev) => ({
      ...prev,
      artigos: prev.artigos.map((a) => (a.id === artigo.id ? artigo : a)),
    }));
  };

  const handleDeleteArtigo = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      artigos: prev.artigos.filter((a) => a.id !== id),
    }));
  };

  // -------------------------------------------------------------
  // LOCALIZAÇÕES
  // -------------------------------------------------------------

  const handleAddLocation = (location: Location) => {
    setDatabase((prev) => ({
      ...prev,
      localizacoes: [...prev.localizacoes, location],
    }));
  };

  const handleUpdateLocation = (location: Location) => {
    setDatabase((prev) => ({
      ...prev,
      localizacoes: prev.localizacoes.map((l) => (l.id === location.id ? location : l)),
    }));
  };

  const handleDeleteLocation = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      localizacoes: prev.localizacoes.filter((l) => l.id !== id),
    }));
  };

  // -------------------------------------------------------------
  // MOVIMENTAÇÕES (ENTRADA / SAÍDA / ATUALIZAÇÃO DE SALDO)
  // -------------------------------------------------------------

  const handleSaveMovement = (movement: Movement) => {
    setDatabase((prev) => {
      // 1. Atualizar saldo e custo do artigo correspondente
      const updatedArtigos = prev.artigos.map((art) => {
        if (art.id === movement.artigoId) {
          const delta = movement.type === 'ENTRADA' ? movement.quantity : -movement.quantity;
          const newStock = Math.max(0, art.currentStock + delta);

          // Se for entrada e tiver custo informado, recalcular ou atualizar custo
          let newUnitCost = art.unitCost;
          if (movement.type === 'ENTRADA' && movement.unitCost && movement.unitCost > 0) {
            newUnitCost = movement.unitCost;
          }

          return {
            ...art,
            currentStock: newStock,
            unitCost: newUnitCost,
            defaultLocationId: movement.locationId || art.defaultLocationId,
            updatedAt: new Date().toISOString(),
          };
        }
        return art;
      });

      return {
        ...prev,
        artigos: updatedArtigos,
        movimentacoes: [movement, ...prev.movimentacoes],
      };
    });
  };

  // -------------------------------------------------------------
  // PERSISTÊNCIA / RESET / DEMO
  // -------------------------------------------------------------

  const handleUpdateGithubConfig = (config: GitHubSyncConfig) => {
    setDatabase((prev) => ({
      ...prev,
      githubConfig: config,
    }));
  };

  const handleRestoreDatabase = (restoredDb: InventoryDatabase) => {
    setDatabase(restoredDb);
  };

  const handleResetDatabase = () => {
    const emptyDb = getEmptyDatabase();
    setDatabase(emptyDb);
    saveDatabase(emptyDb);
  };

  const handleLoadDemoData = () => {
    const demoDb = getDemoDatabase();
    setDatabase(demoDb);
    saveDatabase(demoDb);
  };

  const handleOpenMovementModal = (type: MovementType, defaultArtigoId?: string) => {
    setMovementModal({
      isOpen: true,
      defaultType: type,
      defaultArtigoId,
    });
  };

  const handleOpenNewArtigoModal = () => {
    setActiveTab('hierarchy');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-neutral-900">
      {/* Cabeçalho Institucional SENAI SP */}
      <Header
        artigos={database.artigos}
        movimentacoes={database.movimentacoes}
        lastSaved={database.meta.lastSaved}
        onOpenMovementModal={handleOpenMovementModal}
        onOpenNewArtigoModal={handleOpenNewArtigoModal}
      />

      {/* Barra de Navegação com Menus em Destaque */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        artigosCount={database.artigos.length}
        criticosCount={criticosCount}
        movementsCount={database.movimentacoes.length}
        locationsCount={database.localizacoes.length}
        tiposCount={database.tipos.length}
      />

      {/* Conteúdo Principal com base na Aba Ativa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            tipos={database.tipos}
            artigos={database.artigos}
            localizacoes={database.localizacoes}
            movimentacoes={database.movimentacoes}
            setActiveTab={setActiveTab}
            onOpenMovementModal={handleOpenMovementModal}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {activeTab === 'hierarchy' && (
          <HierarchyView
            tipos={database.tipos}
            grupos={database.grupos}
            subgrupos={database.subgrupos}
            artigos={database.artigos}
            localizacoes={database.localizacoes}
            onAddTipo={handleAddTipo}
            onUpdateTipo={handleUpdateTipo}
            onDeleteTipo={handleDeleteTipo}
            onAddGrupo={handleAddGrupo}
            onUpdateGrupo={handleUpdateGrupo}
            onDeleteGrupo={handleDeleteGrupo}
            onAddSubgrupo={handleAddSubgrupo}
            onUpdateSubgrupo={handleUpdateSubgrupo}
            onDeleteSubgrupo={handleDeleteSubgrupo}
            onAddArtigo={handleAddArtigo}
            onUpdateArtigo={handleUpdateArtigo}
            onDeleteArtigo={handleDeleteArtigo}
          />
        )}

        {activeTab === 'stock' && (
          <StockPositionView
            artigos={database.artigos}
            tipos={database.tipos}
            grupos={database.grupos}
            subgrupos={database.subgrupos}
            localizacoes={database.localizacoes}
            onOpenMovementModal={handleOpenMovementModal}
            onNavigateToHierarchy={() => setActiveTab('hierarchy')}
          />
        )}

        {activeTab === 'movements' && (
          <MovementView
            movimentacoes={database.movimentacoes}
            artigos={database.artigos}
            onOpenMovementModal={handleOpenMovementModal}
          />
        )}

        {activeTab === 'locations' && (
          <LocationsView
            localizacoes={database.localizacoes}
            artigos={database.artigos}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            artigos={database.artigos}
            tipos={database.tipos}
            grupos={database.grupos}
            subgrupos={database.subgrupos}
            localizacoes={database.localizacoes}
            movimentacoes={database.movimentacoes}
          />
        )}

        {activeTab === 'cloud' && (
          <CloudSyncView
            database={database}
            onUpdateGithubConfig={handleUpdateGithubConfig}
            onRestoreDatabase={handleRestoreDatabase}
            onResetDatabase={handleResetDatabase}
            onLoadDemoData={handleLoadDemoData}
          />
        )}
      </main>

      {/* Modal Global de Registro de Movimentações (Entrada / Saída) */}
      <MovementModal
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal((prev) => ({ ...prev, isOpen: false }))}
        defaultType={movementModal.defaultType}
        defaultArtigoId={movementModal.defaultArtigoId}
        artigos={database.artigos}
        localizacoes={database.localizacoes}
        onSaveMovement={handleSaveMovement}
      />

      {/* Rodapé Oficial com Responsabilidade Técnica */}
      <Footer
        artigosCount={database.artigos.length}
        movementsCount={database.movimentacoes.length}
        lastSaved={database.meta.lastSaved}
      />
    </div>
  );
}
