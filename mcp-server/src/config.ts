const DEFAULT_MCP_ENDPOINT = "https://api.yieldagentx402.app/mcp";

export type YieldAgentConfig = {
  endpoint: URL;
  apiKey: string;
  agentId?: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): YieldAgentConfig {
  const endpoint = new URL(
    env.YAX_MCP_ENDPOINT ?? buildEndpointFromApiBase(env.YAX_API_BASE)
  );
  const apiKey = env.YAX_API_KEY ?? "";
  const agentId = env.YAX_AGENT_ID;

  if (!apiKey) {
    throw new Error(
      "YAX_API_KEY is required. Get a key at https://yieldagentx402.app/apply."
    );
  }

  return { endpoint, apiKey, agentId };
}

function buildEndpointFromApiBase(apiBase: string | undefined): string {
  if (!apiBase) return DEFAULT_MCP_ENDPOINT;

  const base = new URL(apiBase);
  if (!base.pathname.endsWith("/mcp")) {
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/mcp`;
  }

  return base.href;
}

export function authHeaders(config: YieldAgentConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    ...(config.agentId ? { "X-Agent-ID": config.agentId } : {}),
  };
}
