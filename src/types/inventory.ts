export interface Tipo {
  id: string;
  code: string; // ex: TIP-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface Grupo {
  id: string;
  tipoId: string;
  code: string; // ex: TIP-01.GRP-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface Subgrupo {
  id: string;
  grupoId: string;
  tipoId: string;
  code: string; // ex: TIP-01.GRP-01.SUB-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  code: string; // ex: LOC-ALM01-C01-E02-N03
  almoxarifado: string; // ex: Almoxarifado Central, Oficina de Usinagem, etc.
  corredor: string; // ex: Corredor A, Rua 02
  estante: string; // ex: Estante 03, Prateleira Industrial
  nivel: string; // ex: Nível 01, Vão 2
  gaveta?: string; // ex: Box 12, Gaveta 04
  description?: string;
  createdAt: string;
}

export interface Artigo {
  id: string;
  code: string; // ex: ART-0001
  hierarchicalCode: string; // ex: TIP-01.GRP-01.SUB-01.ART-001
  name: string;
  tipoId: string;
  grupoId: string;
  subgrupoId: string;
  unit: 'UN' | 'KG' | 'M' | 'L' | 'PC' | 'CX' | 'RL' | 'PAR' | 'KIT' | 'MT';
  minStock: number;
  maxStock: number;
  currentStock: number;
  unitCost: number;
  defaultLocationId?: string;
  specification?: string;
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface Movement {
  id: string;
  type: MovementType;
  artigoId: string;
  artigoName: string;
  artigoCode: string;
  hierarchicalCode: string;
  quantity: number;
  unitCost?: number;
  totalValue?: number;
  previousStock: number;
  newStock: number;
  documentNumber: string; // ex: NF-12345, OS-987, REQ-543
  reason: string; // ex: Compra, Devolução, Aula Prática SENAI, Manutenção, etc.
  originOrDestination: string; // Fornecedor ou Turma/Oficina/Instrutor
  locationId?: string;
  locationDisplay?: string;
  operator: string;
  notes?: string;
  timestamp: string;
}

export interface GitHubSyncConfig {
  token: string;
  mode: 'gist' | 'repo';
  owner?: string;
  repo?: string;
  filePath?: string;
  gistId?: string;
  autoSync: boolean;
  lastSync?: string;
}

export interface InventoryDatabase {
  version: string;
  tipos: Tipo[];
  grupos: Grupo[];
  subgrupos: Subgrupo[];
  artigos: Artigo[];
  localizacoes: Location[];
  movimentacoes: Movement[];
  githubConfig: GitHubSyncConfig;
  meta: {
    systemName: string;
    organization: string;
    technicalManager: string;
    lastSaved: string;
  };
}
