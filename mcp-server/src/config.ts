const DEFAULT_MCP_ENDPOINT = "https://api.yieldagentx402.app/mcp";

export type YieldAgentConfig = {
  endpoint: URL;
  apiKey: string;
  agentId?: string;
  /** Glama/registry sandboxes: tools/list without a key; tools/call still needs YAX_API_KEY. */
  introspectionOnly: boolean;
};

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): YieldAgentConfig {
  const endpoint = new URL(
    env.YAX_MCP_ENDPOINT ?? buildEndpointFromApiBase(env.YAX_API_BASE)
  );
  const apiKey = env.YAX_API_KEY ?? "";
  const agentId = env.YAX_AGENT_ID;
  const introspectionOnly =
    isTruthyEnv(env.YAX_ALLOW_PUBLIC_INTROSPECTION) || isTruthyEnv(env.GLAMA);

  if (!apiKey && !introspectionOnly) {
    throw new Error(
      "YAX_API_KEY is required. Get a key at https://yieldagentx402.app/apply."
    );
  }

  return { endpoint, apiKey, agentId, introspectionOnly };
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
  const headers: Record<string, string> = {};
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  if (config.agentId) {
    headers["X-Agent-ID"] = config.agentId;
  }
  return headers;
}
