import { GitHubSyncConfig, InventoryDatabase } from '../types/inventory';

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  gistUrl?: string;
  repoUrl?: string;
  sha?: string;
}

export const syncToGitHubGist = async (
  config: GitHubSyncConfig,
  database: InventoryDatabase
): Promise<GitHubSyncResult> => {
  if (!config.token) {
    throw new Error('Token de Acesso Pessoal (PAT) do GitHub não configurado.');
  }

  const fileName = 'senai_sp_estoque_db.json';
  const content = JSON.stringify(database, null, 2);
  const now = new Date().toISOString();

  try {
    if (config.gistId && config.gistId.trim() !== '') {
      // Atualizar Gist existente
      const response = await fetch(`https://api.github.com/gists/${config.gistId.trim()}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          description: `SENAI SP | SIGE - Backup de Estoque Industrial (${new Date().toLocaleString('pt-BR')})`,
          files: {
            [fileName]: {
              content,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status} ao atualizar Gist`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `Sincronizado com sucesso no Gist ${config.gistId}!`,
        timestamp: now,
        gistUrl: data.html_url,
      };
    } else {
      // Criar novo Gist
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          description: `SENAI SP | SIGE - Backup de Estoque Industrial (Criado em ${new Date().toLocaleString('pt-BR')})`,
          public: false,
          files: {
            [fileName]: {
              content,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status} ao criar Gist`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `Novo Gist criado com sucesso: ${data.id}`,
        timestamp: now,
        gistUrl: data.html_url,
      };
    }
  } catch (error: any) {
    console.error('Erro na sincronização GitHub Gist:', error);
    return {
      success: false,
      message: error.message || 'Falha ao sincronizar com GitHub Gist.',
      timestamp: now,
    };
  }
};

export const syncToGitHubRepo = async (
  config: GitHubSyncConfig,
  database: InventoryDatabase,
  commitMessage?: string
): Promise<GitHubSyncResult> => {
  if (!config.token) {
    throw new Error('Token do GitHub não configurado.');
  }
  if (!config.owner || !config.repo) {
    throw new Error('Informe o proprietário (Owner) e o repositório no GitHub.');
  }

  const filePath = config.filePath || 'senai-estoque-backup.json';
  const content = JSON.stringify(database, null, 2);
  // Base64 encode UTF-8
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const now = new Date().toISOString();

  try {
    // 1. Verificar se o arquivo já existe para obter o SHA atual
    let existingSha: string | undefined = undefined;
    const checkRes = await fetch(
      `https://api.github.com/repos/${config.owner.trim()}/${config.repo.trim()}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${config.token.trim()}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (checkRes.ok) {
      const fileData = await checkRes.json();
      existingSha = fileData.sha;
    }

    // 2. Criar ou atualizar o arquivo
    const message = commitMessage || `Atualização de Estoque SENAI SP - ${new Date().toLocaleString('pt-BR')}`;
    const body: any = {
      message,
      content: base64Content,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${config.owner.trim()}/${config.repo.trim()}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      }
    );

    if (!putRes.ok) {
      const errorData = await putRes.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${putRes.status} no repositório GitHub`);
    }

    const resData = await putRes.json();
    return {
      success: true,
      message: `Arquivo ${filePath} versionado com sucesso no commit ${resData.commit?.sha?.slice(0, 7) || ''}`,
      timestamp: now,
      repoUrl: resData.content?.html_url || `https://github.com/${config.owner}/${config.repo}`,
      sha: resData.content?.sha,
    };
  } catch (error: any) {
    console.error('Erro no repositório GitHub:', error);
    return {
      success: false,
      message: error.message || 'Falha ao sincronizar com repositório GitHub.',
      timestamp: now,
    };
  }
};

export const pullFromGitHubGist = async (
  token: string,
  gistId: string
): Promise<{ success: boolean; data?: InventoryDatabase; message: string }> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
      headers: {
        Authorization: token ? `Bearer ${token.trim()}` : '',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      throw new Error(`Falha ao buscar Gist (Status ${res.status})`);
    }

    const data = await res.json();
    const files = data.files;
    const targetFile = Object.values(files)[0] as any;
    if (!targetFile || !targetFile.content) {
      throw new Error('Nenhum conteúdo JSON encontrado no Gist.');
    }

    const parsed = JSON.parse(targetFile.content) as InventoryDatabase;
    return {
      success: true,
      data: parsed,
      message: `Dados baixados com sucesso do Gist em ${new Date().toLocaleTimeString('pt-BR')}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro ao carregar dados do Gist.',
    };
  }
};
