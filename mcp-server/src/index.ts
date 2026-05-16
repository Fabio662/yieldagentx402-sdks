#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig } from "./config.js";
import { YieldAgentMcpClient } from "./yieldagent-client.js";

const PACKAGE_VERSION = "1.0.0";

function toMcpError(error: unknown): McpError {
  if (error instanceof McpError) return error;

  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}

async function main() {
  const config = loadConfig();
  const remote = new YieldAgentMcpClient(config);

  const server = new Server(
    {
      name: "@yieldagentx402/mcp-server",
      version: PACKAGE_VERSION,
    },
    {
      capabilities: { tools: {} },
      instructions:
        "Authenticated stdio wrapper for the public YieldAgentX402 MCP endpoint.",
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    try {
      return await remote.listTools(request.params);
    } catch (error) {
      throw toMcpError(error);
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await remote.callTool(request.params);
    } catch (error) {
      throw toMcpError(error);
    }
  });

  const shutdown = async () => {
    await remote.close().catch(() => undefined);
  };

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(130));
  });
  process.once("SIGTERM", () => {
    void shutdown().finally(() => process.exit(143));
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    `[YieldAgentX402 MCP] Connected stdio wrapper to ${config.endpoint.href}\n`
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[YieldAgentX402 MCP] Fatal: ${message}\n`);
  process.exit(1);
});
