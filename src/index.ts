#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigManager } from './config/manager.js';
import { FileOperations } from './utils/file-operations.js';
import { SearchEngine } from './utils/search.js';

class openotesServer {
  private server: Server;
  private configManager: ConfigManager;

  constructor() {
    this.server = new Server({
      name: 'openotes-server',
      version: '1.0.0',
    });

    this.configManager = ConfigManager.getInstance();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Configuration tools
          {
            name: 'openotes_config_set',
            description: 'Configure the notes directory path',
            inputSchema: {
              type: 'object',
              properties: {
                notesDirectory: {
                  type: 'string',
                  description: 'Path to the directory containing markdown notes'
                }
              },
              required: ['notesDirectory']
            }
          },
          {
            name: 'openotes_config_get',
            description: 'Get current openotes configuration',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          
          // Discovery tools
          {
            name: 'openotes_list',
            description: 'List markdown files with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Optional filename pattern to filter results'
                },
                directory: {
                  type: 'string',
                  description: 'Optional subdirectory to search in'
                }
              }
            }
          },
          {
            name: 'openotes_search_files',
            description: 'Search markdown files by filename patterns',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for filename matching'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'openotes_search_content',
            description: 'Full-text search across markdown file contents',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Text to search for in file contents'
                },
                filePattern: {
                  type: 'string',
                  description: 'Optional pattern to filter which files to search'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'openotes_get_structure',
            description: 'Get the complete directory structure of notes',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          
          // Reading tools
          {
            name: 'openotes_read',
            description: 'Read a specific markdown file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: {
                  type: 'string',
                  description: 'Path to the markdown file to read'
                }
              },
              required: ['filepath']
            }
          },
          {
            name: 'openotes_read_multiple',
            description: 'Read multiple markdown files efficiently',
            inputSchema: {
              type: 'object',
              properties: {
                filepaths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of file paths to read'
                }
              },
              required: ['filepaths']
            }
          },
          {
            name: 'openotes_get_metadata',
            description: 'Get metadata for a specific file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: {
                  type: 'string',
                  description: 'Path to get metadata for'
                }
              },
              required: ['filepath']
            }
          },
          
          // Writing tools
          {
            name: 'openotes_create',
            description: 'Create a new markdown file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: {
                  type: 'string',
                  description: 'Path for the new file'
                },
                content: {
                  type: 'string',
                  description: 'Content for the new file'
                }
              },
              required: ['filepath', 'content']
            }
          },
          {
            name: 'openotes_write',
            description: 'Write/overwrite a markdown file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: {
                  type: 'string',
                  description: 'Path to the file to write'
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the file'
                }
              },
              required: ['filepath', 'content']
            }
          },
          {
            name: 'openotes_append',
            description: 'Append content to an existing markdown file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: {
                  type: 'string',
                  description: 'Path to the file to append to'
                },
                content: {
                  type: 'string',
                  description: 'Content to append'
                }
              },
              required: ['filepath', 'content']
            }
          },
          
          // Organization tools
          {
            name: 'openotes_create_directory',
            description: 'Create a new directory for organizing notes',
            inputSchema: {
              type: 'object',
              properties: {
                dirpath: {
                  type: 'string',
                  description: 'Path for the new directory'
                }
              },
              required: ['dirpath']
            }
          },
          {
            name: 'openotes_move_file',
            description: 'Move or rename a file',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'Current file path'
                },
                destination: {
                  type: 'string',
                  description: 'New file path'
                }
              },
              required: ['source', 'destination']
            }
          },
          {
            name: 'openotes_health_check',
            description: 'Check server health and configuration status',
            inputSchema: {
              type: 'object',
              properties: {
                detailed: {
                  type: 'boolean',
                  description: 'Include detailed diagnostic information',
                  default: false
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        switch (name) {
          case 'openotes_config_set':
            return await this.handleConfigSet(args as { notesDirectory: string });
          
          case 'openotes_config_get':
            return await this.handleConfigGet();
          
          case 'openotes_list':
            return await this.handleList(args as { pattern?: string; directory?: string });
          
          case 'openotes_search_files':
            return await this.handleSearchFiles(args as { query: string });
          
          case 'openotes_search_content':
            return await this.handleSearchContent(args as { query: string; filePattern?: string });
          
          case 'openotes_get_structure':
            return await this.handleGetStructure();
          
          case 'openotes_read':
            return await this.handleRead(args as { filepath: string });
          
          case 'openotes_read_multiple':
            return await this.handleReadMultiple(args as { filepaths: string[] });
          
          case 'openotes_get_metadata':
            return await this.handleGetMetadata(args as { filepath: string });
          
          case 'openotes_create':
            return await this.handleCreate(args as { filepath: string; content: string });
          
          case 'openotes_write':
            return await this.handleWrite(args as { filepath: string; content: string });
          
          case 'openotes_append':
            return await this.handleAppend(args as { filepath: string; content: string });
          
          case 'openotes_create_directory':
            return await this.handleCreateDirectory(args as { dirpath: string });
          
          case 'openotes_move_file':
            return await this.handleMoveFile(args as { source: string; destination: string });
          
          case 'openotes_health_check':
            return await this.handleHealthCheck(args as { detailed?: boolean });
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });
  }

  // Configuration handlers
  private async handleConfigSet(args: { notesDirectory: string }) {
    await this.configManager.updateNotesDirectory(args.notesDirectory);
    return {
      content: [
        {
          type: 'text',
          text: `Notes directory updated to: ${args.notesDirectory}`
        }
      ]
    };
  }

  private async handleConfigGet() {
    const config = await this.configManager.getConfig();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(config, null, 2)
        }
      ]
    };
  }

  // Discovery handlers
  private async handleList(args: { pattern?: string; directory?: string }) {
    const config = await this.configManager.getConfig();
    const searchDir = args.directory || config.notesDirectory;
    const files = await FileOperations.listMarkdownFiles(searchDir);
    
    const filteredFiles = args.pattern 
      ? files.filter(file => file.includes(args.pattern!))
      : files;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filteredFiles, null, 2)
        }
      ]
    };
  }

  private async handleSearchFiles(args: { query: string }) {
    const config = await this.configManager.getConfig();
    const results = await SearchEngine.searchFilenames(
      config.notesDirectory, 
      args.query, 
      config.maxSearchResults
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  private async handleSearchContent(args: { query: string; filePattern?: string }) {
    const config = await this.configManager.getConfig();
    const results = await SearchEngine.searchContent(
      config.notesDirectory, 
      args.query, 
      args.filePattern,
      config.maxSearchResults
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  private async handleGetStructure() {
    const config = await this.configManager.getConfig();
    const structure = await FileOperations.getDirectoryStructure(config.notesDirectory);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structure, null, 2)
        }
      ]
    };
  }

  // Reading handlers
  private async handleRead(args: { filepath: string }) {
    const content = await FileOperations.readFile(args.filepath);
    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  }

  private async handleReadMultiple(args: { filepaths: string[] }) {
    const results = await FileOperations.readMultipleFiles(args.filepaths);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  private async handleGetMetadata(args: { filepath: string }) {
    const metadata = await FileOperations.getFileMetadata(args.filepath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(metadata, null, 2)
        }
      ]
    };
  }

  // Writing handlers
  private async handleCreate(args: { filepath: string; content: string }) {
    const exists = await FileOperations.exists(args.filepath);
    if (exists) {
      throw new Error(`File already exists: ${args.filepath}`);
    }
    
    await FileOperations.writeFile(args.filepath, args.content);
    return {
      content: [
        {
          type: 'text',
          text: `File created successfully: ${args.filepath}`
        }
      ]
    };
  }

  private async handleWrite(args: { filepath: string; content: string }) {
    await FileOperations.writeFile(args.filepath, args.content);
    return {
      content: [
        {
          type: 'text',
          text: `File written successfully: ${args.filepath}`
        }
      ]
    };
  }

  private async handleAppend(args: { filepath: string; content: string }) {
    await FileOperations.appendFile(args.filepath, args.content);
    return {
      content: [
        {
          type: 'text',
          text: `Content appended successfully to: ${args.filepath}`
        }
      ]
    };
  }

  // Organization handlers
  private async handleCreateDirectory(args: { dirpath: string }) {
    await FileOperations.ensureDirectory(args.dirpath);
    return {
      content: [
        {
          type: 'text',
          text: `Directory created successfully: ${args.dirpath}`
        }
      ]
    };
  }

  private async handleMoveFile(args: { source: string; destination: string }) {
    await FileOperations.moveFile(args.source, args.destination);
    return {
      content: [
        {
          type: 'text',
          text: `File moved from ${args.source} to ${args.destination}`
        }
      ]
    };
  }

  private async handleHealthCheck(args: { detailed?: boolean }) {
    const config = await this.configManager.getConfig();
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: {
        name: 'openotes-server',
        version: '1.0.0',
        uptime: process.uptime()
      },
      configuration: {
        notesDirectory: config.notesDirectory,
        directoryExists: await FileOperations.exists(config.notesDirectory),
        maxSearchResults: config.maxSearchResults,
        defaultFilePattern: config.defaultFilePattern
      }
    };

    if (args.detailed) {
      try {
        // Count files in notes directory
        const files = await FileOperations.listMarkdownFiles(config.notesDirectory);
        health.configuration.totalMarkdownFiles = files.length;
        health.configuration.excludePatterns = config.excludePatterns;

        // Test file operations
        const testDir = config.notesDirectory;
        const testPath = `${testDir}/.openotes-health-test.md`;
        
        try {
          await FileOperations.writeFile(testPath, '# Health Test\nThis is a test file.');
          await FileOperations.readFile(testPath);
          const fs = await import('fs');
          await fs.promises.unlink(testPath);
          
          health.server.fileOperations = 'working';
        } catch (error) {
          health.server.fileOperations = 'failed';
          health.server.fileOperationsError = error instanceof Error ? error.message : 'unknown';
          health.status = 'unhealthy';
        }
      } catch (error) {
        health.status = 'unhealthy';
        health.server.error = error instanceof Error ? error.message : 'unknown error';
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2)
        }
      ]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('openotes MCP server running on stdio');
  }
}

const server = new openotesServer();
server.run().catch(console.error);