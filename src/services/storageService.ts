import { InventoryDatabase, Tipo, Grupo, Subgrupo, Artigo, Location, Movement, GitHubSyncConfig } from '../types/inventory';

const STORAGE_KEY = 'senai_sp_inventory_db_v1';
const CURRENT_VERSION = '1.0.0';

export const TECHNICAL_MANAGER_NAME = 'M. Isabela César';
export const INSTITUTION_NAME = 'SENAI-SP • Serviço Nacional de Aprendizagem Industrial';
export const SYSTEM_NAME = 'SENAI SP | SIGE - Sistema Integrado de Gestão de Estoque';

// Retorna uma estrutura de banco de dados 100% VAZIA, pronta para testes
export const getEmptyDatabase = (): InventoryDatabase => ({
  version: CURRENT_VERSION,
  tipos: [],
  grupos: [],
  subgrupos: [],
  artigos: [],
  localizacoes: [],
  movimentacoes: [],
  githubConfig: {
    token: '',
    mode: 'gist',
    owner: '',
    repo: '',
    filePath: 'senai-estoque-backup.json',
    gistId: '',
    autoSync: false,
  },
  meta: {
    systemName: SYSTEM_NAME,
    organization: INSTITUTION_NAME,
    technicalManager: TECHNICAL_MANAGER_NAME,
    lastSaved: new Date().toISOString(),
  },
});

export const loadDatabase = (): InventoryDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const emptyDb = getEmptyDatabase();
      saveDatabase(emptyDb);
      return emptyDb;
    }
    const parsed = JSON.parse(raw) as InventoryDatabase;
    return {
      version: parsed.version || CURRENT_VERSION,
      tipos: Array.isArray(parsed.tipos) ? parsed.tipos : [],
      grupos: Array.isArray(parsed.grupos) ? parsed.grupos : [],
      subgrupos: Array.isArray(parsed.subgrupos) ? parsed.subgrupos : [],
      artigos: Array.isArray(parsed.artigos) ? parsed.artigos : [],
      localizacoes: Array.isArray(parsed.localizacoes) ? parsed.localizacoes : [],
      movimentacoes: Array.isArray(parsed.movimentacoes) ? parsed.movimentacoes : [],
      githubConfig: parsed.githubConfig || {
        token: '',
        mode: 'gist',
        autoSync: false,
      },
      meta: {
        systemName: parsed.meta?.systemName || SYSTEM_NAME,
        organization: parsed.meta?.organization || INSTITUTION_NAME,
        technicalManager: parsed.meta?.technicalManager || TECHNICAL_MANAGER_NAME,
        lastSaved: parsed.meta?.lastSaved || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Erro ao carregar banco local:', error);
    return getEmptyDatabase();
  }
};

export const saveDatabase = (db: InventoryDatabase): void => {
  try {
    const updatedDb: InventoryDatabase = {
      ...db,
      meta: {
        ...db.meta,
        lastSaved: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDb));
  } catch (error) {
    console.error('Erro ao persistir banco local:', error);
  }
};

// -------------------------------------------------------------
// GERADORES AUTOMÁTICOS DE CÓDIGOS ÚNICOS HIERÁRQUICOS
// -------------------------------------------------------------

export const generateNextTipoCode = (existingTipos: Tipo[]): string => {
  const count = existingTipos.length + 1;
  const pad = String(count).padStart(2, '0');
  let code = `TIP-${pad}`;
  let i = count;
  while (existingTipos.some((t) => t.code.toUpperCase() === code.toUpperCase())) {
    i++;
    code = `TIP-${String(i).padStart(2, '0')}`;
  }
  return code;
};

export const generateNextGrupoCode = (tipo: Tipo, existingGrupos: Grupo[]): string => {
  const gruposOfTipo = existingGrupos.filter((g) => g.tipoId === tipo.id);
  const count = gruposOfTipo.length + 1;
  const pad = String(count).padStart(2, '0');
  let code = `${tipo.code}.GRP-${pad}`;
  let i = count;
  while (existingGrupos.some((g) => g.code.toUpperCase() === code.toUpperCase())) {
    i++;
    code = `${tipo.code}.GRP-${String(i).padStart(2, '0')}`;
  }
  return code;
};

export const generateNextSubgrupoCode = (grupo: Grupo, existingSubgrupos: Subgrupo[]): string => {
  const subsOfGrupo = existingSubgrupos.filter((s) => s.grupoId === grupo.id);
  const count = subsOfGrupo.length + 1;
  const pad = String(count).padStart(2, '0');
  let code = `${grupo.code}.SUB-${pad}`;
  let i = count;
  while (existingSubgrupos.some((s) => s.code.toUpperCase() === code.toUpperCase())) {
    i++;
    code = `${grupo.code}.SUB-${String(i).padStart(2, '0')}`;
  }
  return code;
};

export const generateNextArtigoCodes = (
  subgrupo: Subgrupo,
  existingArtigos: Artigo[]
): { code: string; hierarchicalCode: string; barcode: string } => {
  // Código interno único ART-XXXX
  const totalArtigos = existingArtigos.length + 1;
  let codeNum = totalArtigos;
  let uniqueCode = `ART-${String(codeNum).padStart(4, '0')}`;
  while (existingArtigos.some((a) => a.code.toUpperCase() === uniqueCode.toUpperCase())) {
    codeNum++;
    uniqueCode = `ART-${String(codeNum).padStart(4, '0')}`;
  }

  // Código hierárquico único dentro do subgrupo
  const artigosInSub = existingArtigos.filter((a) => a.subgrupoId === subgrupo.id);
  let subCount = artigosInSub.length + 1;
  let hierarchicalCode = `${subgrupo.code}.ART-${String(subCount).padStart(3, '0')}`;
  while (existingArtigos.some((a) => a.hierarchicalCode.toUpperCase() === hierarchicalCode.toUpperCase())) {
    subCount++;
    hierarchicalCode = `${subgrupo.code}.ART-${String(subCount).padStart(3, '0')}`;
  }

  // Código de barras numérico único baseado no padrão industrial (ex: 789SENAI + sequencial)
  const barcode = `789000${String(codeNum).padStart(6, '0')}`;

  return { code: uniqueCode, hierarchicalCode, barcode };
};

export const generateNextLocationCode = (
  almoxarifado: string,
  corredor: string,
  estante: string,
  nivel: string,
  existingLocations: Location[]
): string => {
  // Limpar caracteres e pegar sufixos
  const cleanStr = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'X';
  const prefix = `LOC-${cleanStr(almoxarifado)}-${cleanStr(corredor)}-${cleanStr(estante)}-${cleanStr(nivel)}`;
  let code = prefix;
  let count = 1;
  while (existingLocations.some((l) => l.code === code)) {
    code = `${prefix}-${count}`;
    count++;
  }
  return code;
};

export const generateDocumentNumber = (type: 'ENTRADA' | 'SAIDA'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const prefix = type === 'ENTRADA' ? 'ENT' : 'SAI';
  return `${prefix}-${year}${month}${day}-${rand}`;
};

// -------------------------------------------------------------
// DADOS DE EXEMPLO (OPCIONAIS PARA TESTES RÁPIDOS)
// -------------------------------------------------------------

export const getDemoDatabase = (): InventoryDatabase => {
  const now = new Date().toISOString();

  const tipos: Tipo[] = [
    { id: 'tip-1', code: 'TIP-01', name: 'Matéria-Prima (Metalurgia)', description: 'Barras, chapas e perfis para usinagem e soldagem', createdAt: now },
    { id: 'tip-2', code: 'TIP-02', name: 'Ferramentas de Usinagem', description: 'Fresas, brocas, pastilhas intercambiáveis e machos', createdAt: now },
    { id: 'tip-3', code: 'TIP-03', name: 'Componentes Eletroeletrônicos', description: 'Sensores, CLPs, contatores, relés e bornes', createdAt: now },
    { id: 'tip-4', code: 'TIP-04', name: 'EPIs e Segurança do Trabalho', description: 'Óculos, protetores auriculares, luvas e máscaras', createdAt: now },
  ];

  const grupos: Grupo[] = [
    { id: 'grp-1', tipoId: 'tip-1', code: 'TIP-01.GRP-01', name: 'Aços Carbono e Ligados', description: 'Aço 1020, 1045 e 4140 para oficina', createdAt: now },
    { id: 'grp-2', tipoId: 'tip-2', code: 'TIP-02.GRP-01', name: 'Brocas Helicoidais e HSS', description: 'Ferramental para furadeiras e centros de usinagem', createdAt: now },
    { id: 'grp-3', tipoId: 'tip-3', code: 'TIP-03.GRP-01', name: 'Automação Industrial e Sensores', description: 'Dispositivos de controle para bancadas didáticas', createdAt: now },
    { id: 'grp-4', tipoId: 'tip-4', code: 'TIP-04.GRP-01', name: 'Proteção Visual e Facial', description: 'Equipamentos individuais de segurança dos alunos', createdAt: now },
  ];

  const subgrupos: Subgrupo[] = [
    { id: 'sub-1', grupoId: 'grp-1', tipoId: 'tip-1', code: 'TIP-01.GRP-01.SUB-01', name: 'Barras Redondas Laminadas', description: 'Tarugos para tornos mecânicos', createdAt: now },
    { id: 'sub-2', grupoId: 'grp-2', tipoId: 'tip-2', code: 'TIP-02.GRP-01.SUB-01', name: 'Brocas de Aço Rápido DIN 338', description: 'Furação padrão com haste cilíndrica', createdAt: now },
    { id: 'sub-3', grupoId: 'grp-3', tipoId: 'tip-3', code: 'TIP-03.GRP-01.SUB-01', name: 'Sensores Indutivos M12/M18', description: 'Detecção de presença metálica nas bancadas', createdAt: now },
    { id: 'sub-4', grupoId: 'grp-4', tipoId: 'tip-4', code: 'TIP-04.GRP-01.SUB-01', name: 'Óculos de Proteção Policarbonato', description: 'Lentes incolores anti-risco', createdAt: now },
  ];

  const localizacoes: Location[] = [
    {
      id: 'loc-1',
      code: 'LOC-ALM1-C01-E01-N01',
      almoxarifado: 'Almoxarifado Central (Prédio A)',
      corredor: 'Rua 01 - Metais',
      estante: 'Porta-Barras A',
      nivel: 'Nível Inferior',
      gaveta: 'Vão 01',
      description: 'Armazenamento de tarugos pesados',
      createdAt: now,
    },
    {
      id: 'loc-2',
      code: 'LOC-ALM1-C02-E03-N02',
      almoxarifado: 'Almoxarifado Central (Prédio A)',
      corredor: 'Rua 02 - Ferramentaria',
      estante: 'Armário de Aço 03',
      nivel: 'Prateleira 02',
      gaveta: 'Gaveta 05 (Brocas)',
      description: 'Ferramental rotativo de corte',
      createdAt: now,
    },
    {
      id: 'loc-3',
      code: 'LOC-ALM2-C01-E02-N04',
      almoxarifado: 'Depósito de Eletroeletrônica (Bloco B)',
      corredor: 'Corredor 01',
      estante: 'Estante Modular B',
      nivel: 'Prateleira 04',
      gaveta: 'Gaveteiro Plástico Azul - Box 14',
      description: 'Sensores e componentes sensíveis',
      createdAt: now,
    },
    {
      id: 'loc-4',
      code: 'LOC-ALM1-C03-E01-N03',
      almoxarifado: 'Almoxarifado Central (Prédio A)',
      corredor: 'Rua 03 - EPIs e Consumíveis',
      estante: 'Estante Fechada 01',
      nivel: 'Nível 03',
      gaveta: 'Caixa Organizadora 02',
      description: 'EPIs para distribuição aos alunos e instrutores',
      createdAt: now,
    },
  ];

  const artigos: Artigo[] = [
    {
      id: 'art-1',
      code: 'ART-0001',
      hierarchicalCode: 'TIP-01.GRP-01.SUB-01.ART-001',
      name: 'Barra Redonda Aço SAE 1045 Ø 1.1/2" x 3m',
      tipoId: 'tip-1',
      grupoId: 'grp-1',
      subgrupoId: 'sub-1',
      unit: 'PC',
      minStock: 10,
      maxStock: 50,
      currentStock: 24,
      unitCost: 85.5,
      defaultLocationId: 'loc-1',
      specification: 'Aço trefilado para torneamento mecânico nas aulas da oficina SENAI.',
      barcode: '789000000001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art-2',
      code: 'ART-0002',
      hierarchicalCode: 'TIP-02.GRP-01.SUB-01.ART-001',
      name: 'Broca HSS DIN 338 Ø 8.00mm Haste Paralela',
      tipoId: 'tip-2',
      grupoId: 'grp-2',
      subgrupoId: 'sub-2',
      unit: 'UN',
      minStock: 20,
      maxStock: 100,
      currentStock: 15, // Estoque baixo para testar alerta!
      unitCost: 14.8,
      defaultLocationId: 'loc-2',
      specification: 'Broca helicoidal em aço rápido retificado para furadeira de bancada.',
      barcode: '789000000002',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art-3',
      code: 'ART-0003',
      hierarchicalCode: 'TIP-03.GRP-01.SUB-01.ART-001',
      name: 'Sensor Indutivo PNP NA M12 Sn 4mm 10-30VDC',
      tipoId: 'tip-3',
      grupoId: 'grp-3',
      subgrupoId: 'sub-3',
      unit: 'UN',
      minStock: 8,
      maxStock: 30,
      currentStock: 12,
      unitCost: 110.0,
      defaultLocationId: 'loc-3',
      specification: 'Sensor cilíndrico metálico faceado para automação e robótica industrial.',
      barcode: '789000000003',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art-4',
      code: 'ART-0004',
      hierarchicalCode: 'TIP-04.GRP-01.SUB-01.ART-001',
      name: 'Óculos de Segurança Ampla Visão Antiembaçante',
      tipoId: 'tip-4',
      grupoId: 'grp-4',
      subgrupoId: 'sub-4',
      unit: 'UN',
      minStock: 25,
      maxStock: 150,
      currentStock: 68,
      unitCost: 12.5,
      defaultLocationId: 'loc-4',
      specification: 'Certificado de Aprovação (CA) válido, proteção UV e contra impactos.',
      barcode: '789000000004',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const movimentacoes: Movement[] = [
    {
      id: 'mov-1',
      type: 'ENTRADA',
      artigoId: 'art-1',
      artigoName: 'Barra Redonda Aço SAE 1045 Ø 1.1/2" x 3m',
      artigoCode: 'ART-0001',
      hierarchicalCode: 'TIP-01.GRP-01.SUB-01.ART-001',
      quantity: 30,
      unitCost: 85.5,
      totalValue: 2565.0,
      previousStock: 0,
      newStock: 30,
      documentNumber: 'NF-10482',
      reason: 'Compra de Suprimentos para Cursos Técnicos',
      originOrDestination: 'Distribuidora Gerdau / Aços Brasil',
      locationId: 'loc-1',
      locationDisplay: 'Almoxarifado Central > Rua 01 > Porta-Barras A',
      operator: 'Instrutor Carlos Silva - SENAI SP',
      notes: 'Recebimento de lote para semestre letivo',
      timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mov-2',
      type: 'SAIDA',
      artigoId: 'art-1',
      artigoName: 'Barra Redonda Aço SAE 1045 Ø 1.1/2" x 3m',
      artigoCode: 'ART-0001',
      hierarchicalCode: 'TIP-01.GRP-01.SUB-01.ART-001',
      quantity: 6,
      unitCost: 85.5,
      totalValue: 513.0,
      previousStock: 30,
      newStock: 24,
      documentNumber: 'REQ-2026-081',
      reason: 'Aula Prática - Projeto Torneamento Cônico',
      originOrDestination: 'Turma Mecânica de Precisão (Tarde)',
      locationId: 'loc-1',
      locationDisplay: 'Almoxarifado Central > Rua 01 > Porta-Barras A',
      operator: 'Instrutor Carlos Silva - SENAI SP',
      notes: '6 barras fracionadas em tarugos de 200mm para os alunos',
      timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mov-3',
      type: 'ENTRADA',
      artigoId: 'art-2',
      artigoName: 'Broca HSS DIN 338 Ø 8.00mm Haste Paralela',
      artigoCode: 'ART-0002',
      hierarchicalCode: 'TIP-02.GRP-01.SUB-01.ART-001',
      quantity: 20,
      unitCost: 14.8,
      totalValue: 296.0,
      previousStock: 0,
      newStock: 20,
      documentNumber: 'NF-9921',
      reason: 'Reposição de Ferramental de Desgaste',
      originOrDestination: 'Dormer Pramet Ferramentas',
      locationId: 'loc-2',
      locationDisplay: 'Almoxarifado Central > Rua 02 > Armário de Aço 03',
      operator: 'M. Isabela César - Resp. Técnica',
      notes: 'Lote testado e conforme especificações',
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mov-4',
      type: 'SAIDA',
      artigoId: 'art-2',
      artigoName: 'Broca HSS DIN 338 Ø 8.00mm Haste Paralela',
      artigoCode: 'ART-0002',
      hierarchicalCode: 'TIP-02.GRP-01.SUB-01.ART-001',
      quantity: 5,
      unitCost: 14.8,
      totalValue: 74.0,
      previousStock: 20,
      newStock: 15,
      documentNumber: 'OS-8831',
      reason: 'Aula Prática de Furadeira Radial',
      originOrDestination: 'Oficina de Usinagem CNC e Convencional',
      locationId: 'loc-2',
      locationDisplay: 'Almoxarifado Central > Rua 02 > Armário de Aço 03',
      operator: 'M. Isabela César - Resp. Técnica',
      notes: 'Desgaste e afiação em oficina',
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    version: CURRENT_VERSION,
    tipos,
    grupos,
    subgrupos,
    artigos,
    localizacoes,
    movimentacoes,
    githubConfig: {
      token: '',
      mode: 'gist',
      owner: '',
      repo: '',
      filePath: 'senai-estoque-backup.json',
      gistId: '',
      autoSync: false,
    },
    meta: {
      systemName: SYSTEM_NAME,
      organization: INSTITUTION_NAME,
      technicalManager: TECHNICAL_MANAGER_NAME,
      lastSaved: now,
    },
  };
};

// -------------------------------------------------------------
// EXPORTAÇÃO E IMPORTAÇÃO DE ARQUIVO (COMPATÍVEL COM DRIVE/GITHUB)
// -------------------------------------------------------------

export const exportDatabaseToFile = (db: InventoryDatabase): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `SENAI_SP_Estoque_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportReportToCsv = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(';'), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join(
      '\n'
    );
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodeURI(csvContent));
  downloadAnchor.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
