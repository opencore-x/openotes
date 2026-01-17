import { FileOperations } from '../core/files.js';
import type { Config } from '../core/config.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export function getUtilityTools(): ToolDefinition[] {
  return [
    {
      name: 'health',
      description: 'Check server health and vault accessibility',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

export function getUtilityHandlers(config: Config): Record<string, ToolHandler> {
  return {
    health: async () => {
      const files = await FileOperations.listMarkdownFiles(config.vaultPath);

      const healthInfo = {
        status: 'healthy',
        vault: {
          path: config.vaultPath,
          fileCount: files.length,
        },
        config: {
          port: config.port,
          maxSearchResults: config.maxSearchResults,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(healthInfo, null, 2),
          },
        ],
      };
    },
  };
}
