import { FileOperations } from '../core/files.js';
import { PathValidator } from '../core/paths.js';
import type { Config } from '../core/config.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export function getOrganizationTools(): ToolDefinition[] {
  return [
    {
      name: 'create_directory',
      description: 'Create a new directory (folder) in the vault',
      inputSchema: {
        type: 'object',
        properties: {
          dirpath: {
            type: 'string',
            description: 'Relative path for the new directory from vault root',
          },
        },
        required: ['dirpath'],
      },
    },
    {
      name: 'move',
      description: 'Move or rename a file within the vault',
      inputSchema: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description: 'Relative path of the source file',
          },
          destination: {
            type: 'string',
            description: 'Relative path of the destination',
          },
        },
        required: ['source', 'destination'],
      },
    },
    {
      name: 'delete',
      description: 'Delete a file from the vault (requires explicit confirmation)',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path to the file to delete',
          },
          confirm: {
            type: 'boolean',
            description: 'Must be true to confirm deletion',
          },
        },
        required: ['filepath', 'confirm'],
      },
    },
  ];
}

export function getOrganizationHandlers(
  _config: Config,
  pathValidator: PathValidator
): Record<string, ToolHandler> {
  return {
    create_directory: async (args: { dirpath: string }) => {
      const absolutePath = await pathValidator.resolve(args.dirpath);
      await FileOperations.ensureDirectory(absolutePath);

      return {
        content: [
          {
            type: 'text',
            text: `Created directory: ${args.dirpath}`,
          },
        ],
      };
    },

    move: async (args: { source: string; destination: string }) => {
      const sourcePath = await pathValidator.resolve(args.source);
      const destPath = await pathValidator.resolve(args.destination);

      if (!(await FileOperations.exists(sourcePath))) {
        throw new Error(`Source file does not exist: ${args.source}`);
      }

      await FileOperations.moveFile(sourcePath, destPath);

      return {
        content: [
          {
            type: 'text',
            text: `Moved: ${args.source} → ${args.destination}`,
          },
        ],
      };
    },

    delete: async (args: { filepath: string; confirm: boolean }) => {
      if (!args.confirm) {
        throw new Error('Deletion requires confirm: true');
      }

      const absolutePath = await pathValidator.resolve(args.filepath);

      if (!(await FileOperations.exists(absolutePath))) {
        throw new Error(`File does not exist: ${args.filepath}`);
      }

      await FileOperations.deleteFile(absolutePath);

      return {
        content: [
          {
            type: 'text',
            text: `Deleted: ${args.filepath}`,
          },
        ],
      };
    },
  };
}
