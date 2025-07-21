import { promises as fs } from 'fs';
import { join, dirname, isAbsolute } from 'path';
import { homedir } from 'os';
import type { openotesConfig } from '../types/index.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: openotesConfig | null = null;
  private readonly configPath: string;

  private constructor() {
    this.configPath = join(homedir(), '.openotes', 'config.json');
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(): Promise<openotesConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      return this.config!;
    } catch (error) {
      // Return default config if file doesn't exist
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  async saveConfig(config: openotesConfig): Promise<void> {
    // Ensure config directory exists
    await fs.mkdir(dirname(this.configPath), { recursive: true });
    
    // Validate config
    this.validateConfig(config);
    
    // Save config
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  async updateNotesDirectory(path: string): Promise<void> {
    const config = await this.loadConfig();
    config.notesDirectory = path;
    await this.saveConfig(config);
  }

  private getDefaultConfig(): openotesConfig {
    return {
      notesDirectory: join(homedir(), 'Documents', 'Notes'), // Already absolute path
      maxSearchResults: 50,
      defaultFilePattern: '**/*.md',
      excludePatterns: ['node_modules/**', '.git/**', '**/.*']
    };
  }

  private validateConfig(config: openotesConfig): void {
    if (!config.notesDirectory || typeof config.notesDirectory !== 'string') {
      throw new Error('notesDirectory is required and must be a string');
    }

    if (!isAbsolute(config.notesDirectory)) {
      throw new Error('notesDirectory must be an absolute path to avoid configuration issues');
    }

    if (config.maxSearchResults !== undefined && 
        (typeof config.maxSearchResults !== 'number' || config.maxSearchResults < 1)) {
      throw new Error('maxSearchResults must be a positive number');
    }
  }

  async getConfig(): Promise<openotesConfig> {
    return this.loadConfig();
  }
}