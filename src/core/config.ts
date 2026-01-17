import { promises as fs } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import 'dotenv/config';

export interface Config {
  port: number;
  vaultPath: string;
  maxSearchResults: number;
}

function expandTilde(filepath: string): string {
  if (filepath.startsWith('~')) {
    return filepath.replace('~', homedir());
  }
  return filepath;
}

async function validateVaultPath(vaultPath: string): Promise<void> {
  try {
    const stats = await fs.stat(vaultPath);
    if (!stats.isDirectory()) {
      throw new Error(`VAULT_PATH is not a directory: ${vaultPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`VAULT_PATH does not exist: ${vaultPath}`);
    }
    throw error;
  }
}

export async function loadConfig(): Promise<Config> {
  const port = parseInt(process.env.PORT || '3000', 10);
  const rawVaultPath = process.env.VAULT_PATH;
  const maxSearchResults = parseInt(process.env.MAX_SEARCH_RESULTS || '50', 10);

  if (!rawVaultPath) {
    throw new Error('VAULT_PATH environment variable is required');
  }

  const vaultPath = resolve(expandTilde(rawVaultPath));
  await validateVaultPath(vaultPath);

  return {
    port,
    vaultPath,
    maxSearchResults,
  };
}
