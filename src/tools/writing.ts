import { FileOperations } from '../core/files.js';
import { PathValidator } from '../core/paths.js';
import type { Config } from '../core/config.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export function getWritingTools(): ToolDefinition[] {
  return [
    {
      name: 'create',
      description: 'Create a new markdown file (fails if file already exists)',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path for the new file from vault root',
          },
          content: {
            type: 'string',
            description: 'Content to write to the file',
          },
        },
        required: ['filepath', 'content'],
      },
    },
    {
      name: 'write',
      description: 'Overwrite an existing file with new content',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path to the file from vault root',
          },
          content: {
            type: 'string',
            description: 'Content to write to the file',
          },
        },
        required: ['filepath', 'content'],
      },
    },
    {
      name: 'append',
      description: 'Append content to the end of an existing file',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path to the file from vault root',
          },
          content: {
            type: 'string',
            description: 'Content to append to the file',
          },
        },
        required: ['filepath', 'content'],
      },
    },
    {
      name: 'edit',
      description: 'Perform a surgical find/replace edit on a file',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'Relative path to the file from vault root',
          },
          old_content: {
            type: 'string',
            description: 'The exact content to find and replace',
          },
          new_content: {
            type: 'string',
            description: 'The content to replace it with',
          },
        },
        required: ['filepath', 'old_content', 'new_content'],
      },
    },
  ];
}

export function getWritingHandlers(
  _config: Config,
  pathValidator: PathValidator
): Record<string, ToolHandler> {
  return {
    create: async (args: { filepath: string; content: string }) => {
      const absolutePath = await pathValidator.resolve(args.filepath);

      if (await FileOperations.exists(absolutePath)) {
        throw new Error(`File already exists: ${args.filepath}`);
      }

      await FileOperations.writeFile(absolutePath, args.content);

      return {
        content: [
          {
            type: 'text',
            text: `Created: ${args.filepath}`,
          },
        ],
      };
    },

    write: async (args: { filepath: string; content: string }) => {
      const absolutePath = await pathValidator.resolve(args.filepath);
      await FileOperations.writeFile(absolutePath, args.content);

      return {
        content: [
          {
            type: 'text',
            text: `Written: ${args.filepath}`,
          },
        ],
      };
    },

    append: async (args: { filepath: string; content: string }) => {
      const absolutePath = await pathValidator.resolve(args.filepath);

      if (!(await FileOperations.exists(absolutePath))) {
        throw new Error(`File does not exist: ${args.filepath}`);
      }

      await FileOperations.appendFile(absolutePath, args.content);

      return {
        content: [
          {
            type: 'text',
            text: `Appended to: ${args.filepath}`,
          },
        ],
      };
    },

    edit: async (args: { filepath: string; old_content: string; new_content: string }) => {
      const absolutePath = await pathValidator.resolve(args.filepath);
      await FileOperations.editFile(absolutePath, args.old_content, args.new_content);

      return {
        content: [
          {
            type: 'text',
            text: `Edited: ${args.filepath}`,
          },
        ],
      };
    },
  };
}
