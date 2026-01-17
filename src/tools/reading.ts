import { FileOperations } from '../core/files.js';
import { PathValidator } from '../core/paths.js';
import type { Config } from '../core/config.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export function getReadingTools(): ToolDefinition[] {
  return [
    {
      name: 'read',
      description: 'Read the contents of a single markdown file',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path to the file from vault root',
          },
        },
        required: ['filepath'],
      },
    },
    {
      name: 'read_multiple',
      description: 'Read the contents of multiple markdown files at once',
      inputSchema: {
        type: 'object',
        properties: {
          filepaths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of relative file paths from vault root',
          },
        },
        required: ['filepaths'],
      },
    },
  ];
}

export function getReadingHandlers(
  config: Config,
  pathValidator: PathValidator
): Record<string, ToolHandler> {
  return {
    read: async (args: { filepath: string }) => {
      const absolutePath = await pathValidator.resolve(args.filepath);
      const content = await FileOperations.readFile(absolutePath);

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    },

    read_multiple: async (args: { filepaths: string[] }) => {
      const absolutePaths = await Promise.all(
        args.filepaths.map((fp) => pathValidator.resolve(fp))
      );

      const results = await FileOperations.readMultipleFiles(absolutePaths);

      const formattedResults = results.map((r) => ({
        path: pathValidator.toRelative(r.path),
        content: r.content,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    },
  };
}
