import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolRequest, ListToolsRequest } from "@modelcontextprotocol/sdk/types.js";

import { authHeaders, type YieldAgentConfig } from "./config.js";

const CLIENT_VERSION = "1.0.0";

export class YieldAgentMcpClient {
  private client?: Client;
  private transport?: StreamableHTTPClientTransport;

  constructor(private readonly config: YieldAgentConfig) {}

  async connect(): Promise<void> {
    if (this.client) return;

    const client = new Client({
      name: "@yieldagentx402/mcp-server",
      version: CLIENT_VERSION,
    });
    const transport = new StreamableHTTPClientTransport(this.config.endpoint, {
      requestInit: {
        headers: authHeaders(this.config),
      },
    });

    try {
      await client.connect(transport);
    } catch (error) {
      await transport.close().catch(() => undefined);
      throw error;
    }

    this.client = client;
    this.transport = transport;
  }

  async close(): Promise<void> {
    const transport = this.transport;
    this.client = undefined;
    this.transport = undefined;

    if (transport) {
      await transport.close();
    }
  }

  async listTools(params?: ListToolsRequest["params"]) {
    const client = await this.connectedClient();
    return client.listTools(params);
  }

  async callTool(params: CallToolRequest["params"]) {
    if (this.config.introspectionOnly && !this.config.apiKey) {
      const name = params?.name ?? "";
      if (name !== "yax_get_capabilities") {
        throw new Error(
          "YAX_API_KEY is required for tools/call (except yax_get_capabilities). Get a key at https://yieldagentx402.app/apply."
        );
      }
    }

    const client = await this.connectedClient();
    return client.callTool(params);
  }

  private async connectedClient(): Promise<Client> {
    await this.connect();

    if (!this.client) {
      throw new Error("YieldAgentX402 MCP client failed to initialize.");
    }

    return this.client;
  }
}
