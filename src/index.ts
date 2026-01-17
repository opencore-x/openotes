import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, type Config } from './core/config.js';
import { PathValidator } from './core/paths.js';

import { getDiscoveryTools, getDiscoveryHandlers } from './tools/discovery.js';
import { getReadingTools, getReadingHandlers } from './tools/reading.js';
import { getWritingTools, getWritingHandlers } from './tools/writing.js';
import { getOrganizationTools, getOrganizationHandlers } from './tools/organization.js';
import { getUtilityTools, getUtilityHandlers } from './tools/utility.js';
import type { ToolHandler } from './types/index.js';

const sessions = new Map<string, { server: Server; transport: StreamableHTTPServerTransport }>();

function createMCPServer(config: Config, pathValidator: PathValidator): Server {
  const server = new Server(
    { name: 'openotes-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  const tools = [
    ...getDiscoveryTools(),
    ...getReadingTools(),
    ...getWritingTools(),
    ...getOrganizationTools(),
    ...getUtilityTools(),
  ];

  const handlers: Record<string, ToolHandler> = {
    ...getDiscoveryHandlers(config, pathValidator),
    ...getReadingHandlers(config, pathValidator),
    ...getWritingHandlers(config, pathValidator),
    ...getOrganizationHandlers(config, pathValidator),
    ...getUtilityHandlers(config),
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    const handler = handlers[name];

    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    try {
      return await handler(args || {}) as CallToolResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new McpError(ErrorCode.InternalError, message);
    }
  });

  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  return server;
}

async function main() {
  const config = await loadConfig();
  const pathValidator = new PathValidator(config.vaultPath);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.all('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'DELETE') {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.close();
        sessions.delete(sessionId);
        res.status(200).json({ message: 'Session terminated' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
      return;
    }

    if (req.method === 'GET') {
      if (!sessionId || !sessions.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID for SSE' });
        return;
      }
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
      return;
    }

    if (req.method === 'POST') {
      let session = sessionId ? sessions.get(sessionId) : undefined;

      if (!session) {
        const newSessionId = randomUUID();
        const server = createMCPServer(config, pathValidator);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          onsessioninitialized: (id) => {
            console.log(`Session initialized: ${id}`);
          },
        });

        await server.connect(transport);
        session = { server, transport };
        sessions.set(newSessionId, session);
      }

      await session.transport.handleRequest(req, res);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  });

  app.listen(config.port, '127.0.0.1', () => {
    console.log(`openotes MCP server running at http://127.0.0.1:${config.port}/mcp`);
    console.log(`Vault: ${config.vaultPath}`);
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    for (const [id, session] of sessions) {
      await session.transport.close();
      sessions.delete(id);
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
