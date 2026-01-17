import { FileOperations } from '../core/files.js';
import { SearchEngine } from '../core/search.js';
import { PathValidator } from '../core/paths.js';
import type { Config } from '../core/config.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export function getDiscoveryTools(): ToolDefinition[] {
  return [
    {
      name: 'list',
      description: 'List all markdown files in the vault with optional filter',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Optional filter string to match in file paths',
          },
        },
      },
    },
    {
      name: 'search',
      description: 'Full-text content search across all markdown files',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'search_files',
      description: 'Search for files by filename pattern',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Filename pattern to search for',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_structure',
      description: 'Get the complete directory tree structure of the vault',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

export function getDiscoveryHandlers(
  config: Config,
  pathValidator: PathValidator
): Record<string, ToolHandler> {
  return {
    list: async (args: { filter?: string }) => {
      const files = await FileOperations.listMarkdownFiles(config.vaultPath);
      let result = files.map((f) => pathValidator.toRelative(f));

      if (args.filter) {
        result = result.filter((f) => f.includes(args.filter!));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },

    search: async (args: { query: string; max_results?: number }) => {
      const maxResults = args.max_results || config.maxSearchResults;
      const results = await SearchEngine.searchContent(
        config.vaultPath,
        args.query,
        undefined,
        maxResults
      );

      const formattedResults = results.map((r) => ({
        path: pathValidator.toRelative(r.path),
        matches: r.matches,
        score: r.score,
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

    search_files: async (args: { query: string; max_results?: number }) => {
      const maxResults = args.max_results || config.maxSearchResults;
      const results = await SearchEngine.searchFilenames(
        config.vaultPath,
        args.query,
        maxResults
      );

      const relativePaths = results.map((f) => pathValidator.toRelative(f));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(relativePaths, null, 2),
          },
        ],
      };
    },

    get_structure: async () => {
      const structure = await FileOperations.getDirectoryStructure(config.vaultPath);

      function convertToRelative(
        node: typeof structure,
        vaultPath: string
      ): typeof structure {
        return {
          ...node,
          path: node.path.startsWith(vaultPath)
            ? node.path.slice(vaultPath.length + 1) || '.'
            : node.path,
          children: node.children?.map((child) =>
            convertToRelative(child, vaultPath)
          ),
        };
      }

      const relativeStructure = convertToRelative(structure, config.vaultPath);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(relativeStructure, null, 2),
          },
        ],
      };
    },
  };
}
