import React, { useState } from 'react';
import {
  CloudUpload,
  Download,
  Github,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileJson,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { GitHubSyncConfig, InventoryDatabase } from '../types/inventory';
import { syncToGitHubGist, syncToGitHubRepo, pullFromGitHubGist } from '../services/githubService';
import { exportDatabaseToFile, TECHNICAL_MANAGER_NAME, INSTITUTION_NAME } from '../services/storageService';

interface CloudSyncViewProps {
  database: InventoryDatabase;
  onUpdateGithubConfig: (config: GitHubSyncConfig) => void;
  onRestoreDatabase: (db: InventoryDatabase) => void;
  onResetDatabase: () => void;
  onLoadDemoData: () => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  database,
  onUpdateGithubConfig,
  onRestoreDatabase,
  onResetDatabase,
  onLoadDemoData,
}) => {
  const [config, setConfig] = useState<GitHubSyncConfig>(database.githubConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string; link?: string } | null>(
    null
  );
  const [customCommitMessage, setCustomCommitMessage] = useState('');

  // Salvar configurações de GitHub
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGithubConfig(config);
    setStatusMsg({
      type: 'info',
      text: 'Configurações de sincronização salvas localmente com sucesso!',
    });
  };

  // Push / Sincronizar para o GitHub
  const handleSyncToGitHub = async () => {
    if (!config.token) {
      setStatusMsg({
        type: 'error',
        text: 'Por favor, informe seu Token de Acesso Pessoal (PAT) do GitHub para sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);

    try {
      if (config.mode === 'gist') {
        const res = await syncToGitHubGist(config, database);
        if (res.success) {
          const updatedConfig: GitHubSyncConfig = {
            ...config,
            lastSync: res.timestamp,
          };
          onUpdateGithubConfig(updatedConfig);
          setConfig(updatedConfig);
          setStatusMsg({
            type: 'success',
            text: res.message,
            link: res.gistUrl,
          });
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      } else {
        const res = await syncToGitHubRepo(config, database, customCommitMessage);
        if (res.success) {
          const updatedConfig: GitHubSyncConfig = {
            ...config,
            lastSync: res.timestamp,
          };
          onUpdateGithubConfig(updatedConfig);
          setConfig(updatedConfig);
          setStatusMsg({
            type: 'success',
            text: res.message,
            link: res.repoUrl,
          });
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Erro inesperado na sincronização com o GitHub.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Puxar do GitHub Gist
  const handlePullFromGist = async () => {
    if (!config.gistId) {
      setStatusMsg({
        type: 'error',
        text: 'Informe o ID do Gist para baixar os dados.',
      });
      return;
    }

    setIsPulling(true);
    try {
      const res = await pullFromGitHubGist(config.token, config.gistId);
      if (res.success && res.data) {
        if (confirm('Deseja substituir os dados locais pelos dados baixados do GitHub?')) {
          onRestoreDatabase(res.data);
          setStatusMsg({
            type: 'success',
            text: 'Dados restaurados com sucesso a partir do GitHub!',
          });
        }
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsPulling(false);
    }
  };

  // Importar arquivo JSON local / Google Drive
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as InventoryDatabase;
        if (!Array.isArray(parsed.artigos) || !Array.isArray(parsed.tipos)) {
          throw new Error('Estrutura de arquivo JSON de estoque inválida.');
        }

        if (confirm(`Restaurar arquivo "${file.name}"? Os dados atuais da sessão serão atualizados.`)) {
          onRestoreDatabase(parsed);
          setStatusMsg({
            type: 'success',
            text: `Backup "${file.name}" restaurado com sucesso!`,
          });
        }
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: `Erro ao importar arquivo: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#E30613] font-bold text-xs uppercase tracking-wider">
            <CloudUpload className="w-4 h-4" />
            <span>Persistência & Sincronização em Nuvem</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Armazenamento em GitHub e Google Drive
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Persistência automática local (IndexedDB/Storage) com sincronização em nuvem e versionamento de dados.
          </p>
        </div>

        {/* Status de Persistência */}
        <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Persistência Local: Ativa</div>
            <div className="text-[10px] text-emerald-700">Dados sobrevivem a reloads e fechamento do navegador.</div>
          </div>
        </div>
      </div>

      {/* Alerta de Mensagem de Status */}
      {statusMsg && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-start space-x-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{statusMsg.text}</p>
            {statusMsg.link && (
              <a
                href={statusMsg.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center space-x-1 underline font-bold text-[#E30613]"
              >
                <span>Visualizar arquivo na nuvem</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Grid: 1. GitHub Integration | 2. Google Drive & Arquivo JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* CARTÃO 1: INTEGRAÇÃO GITHUB (VERSIONAMENTO) */}
        {/* ========================================================= */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-neutral-900 text-white rounded">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Integração GitHub (Versionamento)</h3>
                  <p className="text-[11px] text-gray-500">
                    Sincronize o banco de estoque como JSON com histórico de commits.
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-mono font-bold">
                API v3 REST
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Modo de Armazenamento no GitHub:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mode: 'gist' })}
                    className={`py-2 px-3 rounded font-bold border cursor-pointer text-center ${
                      config.mode === 'gist'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    GitHub Gist (Simples & Rápido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mode: 'repo' })}
                    className={`py-2 px-3 rounded font-bold border cursor-pointer text-center ${
                      config.mode === 'repo'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Repositório Próprio (Commit)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Personal Access Token (PAT) do GitHub:
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#E30613]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Necessário escopo 'gist' para modo Gist, ou 'repo' para repositório.
                </span>
              </div>

              {config.mode === 'gist' ? (
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    ID do Gist Existente (Opcional - deixe vazio para criar um novo):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: a1b2c3d4e5f6..."
                    value={config.gistId || ''}
                    onChange={(e) => setConfig({ ...config, gistId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Owner (Usuário/Org):</label>
                      <input
                        type="text"
                        placeholder="Ex: seu-usuario"
                        value={config.owner || ''}
                        onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Repositório:</label>
                      <input
                        type="text"
                        placeholder="Ex: estoque-senai"
                        value={config.repo || ''}
                        onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Caminho do Arquivo:</label>
                    <input
                      type="text"
                      placeholder="senai-estoque-backup.json"
                      value={config.filePath || 'senai-estoque-backup.json'}
                      onChange={(e) => setConfig({ ...config, filePath: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>
              )}

              {config.lastSync && (
                <div className="text-[11px] text-gray-500 font-mono">
                  Última sincronização no GitHub:{' '}
                  <strong>{new Date(config.lastSync).toLocaleString('pt-BR')}</strong>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-gray-100 hover:bg-gray-200 text-neutral-800 font-bold px-3 py-1.5 rounded cursor-pointer border border-gray-300"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>

          {/* Botões de Ação GitHub */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={handleSyncToGitHub}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 bg-[#E30613] hover:bg-[#c4000f] disabled:opacity-50 text-white font-bold px-4 py-2 rounded shadow cursor-pointer transition-colors"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncing ? 'Sincronizando...' : 'Enviar Estoque para GitHub (Push)'}</span>
            </button>

            {config.mode === 'gist' && config.gistId && (
              <button
                type="button"
                onClick={handlePullFromGist}
                disabled={isPulling}
                className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>Puxar Dados do Gist (Pull)</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARTÃO 2: GOOGLE DRIVE E BACKUP LOCAL JSON */}
        {/* ========================================================= */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-700 text-white rounded">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Armazenamento em Google Drive / Arquivo</h3>
                  <p className="text-[11px] text-gray-500">
                    Exportação e importação direta de arquivos compatíveis com o Google Drive.
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                GDrive Ready
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Você pode baixar um snapshot completo de todo o inventário estruturado (Tipos, Grupos, Subgrupos, Artigos, Localizações e Histórico de Kardex) em formato <strong>JSON padronizado</strong>. Esse arquivo pode ser salvo diretamente no seu <strong>Google Drive</strong> para backup seguro ou compartilhado com outros computadores e instrutores do SENAI-SP.
              </p>

              <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-2">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-[#E30613]" />
                  <span>Resumo do Banco Atual para Exportação:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-700 font-mono">
                  <div>• Tipos: {database.tipos.length}</div>
                  <div>• Grupos: {database.grupos.length}</div>
                  <div>• Subgrupos: {database.subgrupos.length}</div>
                  <div>• Artigos: {database.artigos.length}</div>
                  <div>• Localizações: {database.localizacoes.length}</div>
                  <div>• Kardex: {database.movimentacoes.length}</div>
                </div>
              </div>

              {/* Upload de Arquivo para Restaurar */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Importar Arquivo de Backup (Google Drive ou Local):
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer border border-gray-300 rounded p-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => exportDatabaseToFile(database)}
              className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded shadow cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Arquivo de Backup (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO: GERENCIAMENTO DE BASE PARA TESTES E VALIDAÇÃO */}
      {/* ========================================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-neutral-900 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 text-[#E30613]" />
          <h3>Administração da Base de Dados para Validação e Testes</h3>
        </div>
        <p className="text-xs text-gray-600 max-w-3xl">
          Como exigido no escopo de validação, a base de dados inicia 100% vazia para permitir testes livres. Você pode alternar entre carregar uma massa de dados de teste (com tornos, fresas e brocas da oficina SENAI) ou resetar completamente a base para o estado vazio.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (
                confirm(
                  'Carregar dados demonstrativos da oficina SENAI-SP? Os dados atuais serão substituídos pelos de demonstração.'
                )
              ) {
                onLoadDemoData();
                setStatusMsg({
                  type: 'success',
                  text: 'Dados de demonstração do SENAI carregados com sucesso para testes!',
                });
              }
            }}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded shadow cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Carregar Dados de Exemplo (Oficina SENAI)</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  'ATENÇÃO: Deseja realmente ZERAR toda a base de dados? Todos os Tipos, Grupos, Subgrupos, Artigos e Movimentações serão apagados para um início limpo.'
                )
              ) {
                onResetDatabase();
                setStatusMsg({
                  type: 'info',
                  text: 'Base de dados zerada com sucesso. Pronto para novos cadastros e testes!',
                });
              }
            }}
            className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-[#E30613] border border-red-300 text-xs font-bold px-4 py-2 rounded cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Zerar Base de Dados (Limpar Tudo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
