/**
 * yieldagentx402 — TypeScript SDK
 *
 * Custody-free, policy-gated, receipt-backed agent execution across 18 chains.
 * Zero runtime deps: uses fetch + WebCrypto only. Works in Node 18+, browsers,
 * Cloudflare Workers, Deno, Bun.
 *
 * Quickstart:
 *   import { YieldAgentX402 } from "yieldagentx402";
 *   const yax = new YieldAgentX402({ apiKey: process.env.YAX_API_KEY });
 *   const wallet = await yax.getWalletStatus();
 *   const tx = await yax.processX402Payment({ recipient: "0x...", amount: "1.00" });
 *
 * Public discovery (no apiKey needed):
 *   const yax = new YieldAgentX402();
 *   const caps = await yax.getCapabilities();
 */

import {
  CapabilitiesResponse,
  WalletStatusResponse,
  RunSecureWorkflowArgs,
  RunSecureWorkflowResponse,
  ProcessX402PaymentArgs,
  PaymentReceipt,
  CheckPolicyArgs,
  PolicyCheckResponse,
  ReceiptResponse,
  VerifyReceiptResponse,
  ListRunsResponse,
  AttestationResponse,
  GenericToolResponse,
  YAXError,
} from "./types.js";

export * from "./types.js";

export interface YAXClientOptions {
  /** Bearer API key. Omit for public discovery only (yax_get_capabilities). */
  apiKey?: string;
  /** Optional agent ID, sent as X-Agent-ID. */
  agentId?: string;
  /** Override the MCP endpoint. Defaults to https://api.yieldagentx402.app/mcp */
  endpoint?: string;
  /** REST gateway base (for /api/wallet, /api/apply, /api/agent-onboard). */
  apiBase?: string;
  /** Default fetch options merged into every request (e.g. signal, cache). */
  fetchInit?: RequestInit;
  /** Max retries on 429 (default 2). Uses Retry-After header. */
  maxRetries?: number;
}

const DEFAULT_MCP    = "https://api.yieldagentx402.app/mcp";
const DEFAULT_API    = "https://api.yieldagentx402.app";
const SHADE_AGENT_URL = "https://shade-agent-worker.cryptoblac.workers.dev";

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
}

/**
 * Main client. Stateless aside from config — safe to instantiate per-request.
 */
export class YieldAgentX402 {
  readonly apiKey?: string;
  readonly agentId?: string;
  readonly endpoint: string;
  readonly apiBase: string;
  readonly maxRetries: number;
  private readonly _fetchInit: RequestInit;
  private _id = 0;

  constructor(opts: YAXClientOptions = {}) {
    this.apiKey    = opts.apiKey;
    this.agentId   = opts.agentId;
    this.endpoint  = (opts.endpoint  ?? DEFAULT_MCP).replace(/\/+$/, "");
    this.apiBase   = (opts.apiBase   ?? DEFAULT_API).replace(/\/+$/, "");
    this.maxRetries = opts.maxRetries ?? 2;
    this._fetchInit = opts.fetchInit ?? {};
  }

  /** Low-level: invoke any MCP tool by name. Use the typed methods below in normal code. */
  async call<T = GenericToolResponse>(
    toolName: string,
    args: Record<string, unknown> = {},
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const body: JsonRpcEnvelope = {
      jsonrpc: "2.0",
      id: ++this._id,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    if (this.apiKey)  headers["Authorization"] = `Bearer ${this.apiKey}`;
    if (this.agentId) headers["X-Agent-ID"] = this.agentId;

    let attempt = 0;
    while (true) {
      const res = await fetch(this.endpoint, {
        ...this._fetchInit,
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 429 && attempt < this.maxRetries) {
        const retryAfter = Number(res.headers.get("Retry-After") || "1");
        await new Promise(r => setTimeout(r, Math.max(retryAfter, 1) * 1000));
        attempt++;
        continue;
      }

      const json = await res.json();
      if (json.error) {
        throw new YAXError(json.error.message || "JSON-RPC error", "RPC_ERROR", {
          rpcCode: json.error.code,
          raw: json.error,
        });
      }

      const result = json.result;
      // MCP 2025-06-18: prefer structuredContent. Fall back to parsing content[0].text.
      const payload = (result?.structuredContent ?? this._parseTextContent(result)) as T & { ok?: boolean; error?: { code?: string; message?: string; hint?: string } };

      if (payload && payload.ok === false && payload.error) {
        throw new YAXError(payload.error.message || "Tool error", payload.error.code || "TOOL_ERROR", {
          hint: payload.error.hint,
          raw: payload,
        });
      }
      return payload;
    }
  }

  private _parseTextContent(result: unknown): unknown {
    const r = result as { content?: Array<{ type: string; text?: string }> };
    const text = r?.content?.[0]?.text;
    if (typeof text !== "string") return result;
    try { return JSON.parse(text); } catch { return { ok: true, text }; }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC DISCOVERY (no API key required)
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns the full platform capability manifest. No auth required. */
  getCapabilities(): Promise<CapabilitiesResponse> {
    return this.call<CapabilitiesResponse>("yax_get_capabilities");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WALLET & CUSTODY
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns agent wallet info + live Shade Agent MPC addresses (EVM/BTC/Starknet). */
  getWalletStatus(): Promise<WalletStatusResponse> {
    return this.call<WalletStatusResponse>("yax_get_wallet_status");
  }

  /**
   * Direct fetch of the Shade Agent MPC manifest (public, no auth).
   * Returns one NEAR MPC key authority's addresses across EVM + BTC + Starknet.
   */
  async getShadeAgentWallet(shadeAgentUrl: string = SHADE_AGENT_URL): Promise<{
    success: boolean;
    custodyModel: string;
    keyAuthority: string | null;
    attestation: string | null;
    addresses: { evm: string | null; bitcoin: string | null; starknet: string | null };
    paths: { evm: string; bitcoin: string };
    supportedChains: string[];
  }> {
    const r = await fetch(`${shadeAgentUrl.replace(/\/+$/, "")}/api/wallet`, this._fetchInit);
    if (!r.ok) throw new YAXError(`Shade Agent wallet fetch failed: ${r.status}`, "SHADE_AGENT_ERROR");
    return r.json();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXECUTION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Run a governed workflow inside the TEE. Optionally provide a webhook_url
   * to get a signed callback on completion (no polling needed).
   */
  runSecureWorkflow(args: RunSecureWorkflowArgs): Promise<RunSecureWorkflowResponse> {
    return this.call<RunSecureWorkflowResponse>("yax_run_secure_workflow", args as unknown as Record<string, unknown>);
  }

  /**
   * Send an x402 payment on any of 18 supported chains. Pass an idempotency_key
   * (or X-Idempotency-Key header) to safely retry — replays return the original
   * receipt with idempotency_replay:true.
   */
  processX402Payment(args: ProcessX402PaymentArgs): Promise<PaymentReceipt> {
    const headers: Record<string, string> = {};
    if (args.idempotency_key) headers["X-Idempotency-Key"] = args.idempotency_key;
    return this.call<PaymentReceipt>("yax_process_x402_payment", args as unknown as Record<string, unknown>, headers);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POLICY & GOVERNANCE
  // ──────────────────────────────────────────────────────────────────────────

  /** Dry-run ShadeGuard policy — no action taken, just the decision. */
  checkPolicy(args: CheckPolicyArgs): Promise<PolicyCheckResponse> {
    return this.call<PolicyCheckResponse>("yax_check_policy", args as unknown as Record<string, unknown>);
  }

  /** Returns TEE attestation report + mrEnclave fingerprint. */
  getAttestation(): Promise<AttestationResponse> {
    return this.call<AttestationResponse>("yax_get_attestation");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RECEIPTS & AUDIT
  // ──────────────────────────────────────────────────────────────────────────

  /** Fetch the full signed receipt for a run. */
  getReceipt(runId: string): Promise<ReceiptResponse> {
    return this.call<ReceiptResponse>("yax_get_receipt", { run_id: runId });
  }

  /** Verify a receipt's HMAC signature and Filecoin anchor server-side. */
  verifyReceipt(runId: string): Promise<VerifyReceiptResponse> {
    return this.call<VerifyReceiptResponse>("yax_verify_receipt", { run_id: runId });
  }

  /** List recent runs, optionally filtered by status. */
  listRuns(opts: { status?: string; limit?: number } = {}): Promise<ListRunsResponse> {
    return this.call<ListRunsResponse>("yax_list_runs", opts as Record<string, unknown>);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WORKFLOWS (sales/finance skill tools)
  // ──────────────────────────────────────────────────────────────────────────

  scoreLeads(args: { leads: unknown[]; top_n?: number }): Promise<GenericToolResponse> {
    return this.call("yax_score_leads", args as Record<string, unknown>);
  }
  enrichLead(args: { lead: Record<string, unknown> }): Promise<GenericToolResponse> {
    return this.call("yax_enrich_lead_data", args as Record<string, unknown>);
  }
  buildEmailSequence(args: { lead: Record<string, unknown>; touches?: number; tone?: string }): Promise<GenericToolResponse> {
    return this.call("yax_build_email_sequence", args as Record<string, unknown>);
  }
  monitorChurnRisk(args: { threshold?: "high" | "medium" | "any"; send?: boolean } = {}): Promise<GenericToolResponse> {
    return this.call("yax_monitor_churn_risk", args as Record<string, unknown>);
  }
  collectARInvoices(args: { send?: boolean; days_overdue_min?: number } = {}): Promise<GenericToolResponse> {
    return this.call("yax_collect_ar_invoices", args as Record<string, unknown>);
  }
  forecastCashFlow(args: { horizon_days?: number; scenarios?: string[] } = {}): Promise<GenericToolResponse> {
    return this.call("yax_forecast_cash_flow", args as Record<string, unknown>);
  }
  auditCompliance(args: { since?: string; run_ids?: string[] } = {}): Promise<GenericToolResponse> {
    return this.call("yax_audit_compliance", args as Record<string, unknown>);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REST helpers (not MCP)
  // ──────────────────────────────────────────────────────────────────────────

  /** Get an instant test API key ($5 cap, 7-day TTL). Public endpoint. */
  async applyForTestKey(opts: { agent_name?: string; email?: string; use_case?: string } = {}): Promise<{
    success: boolean; api_key: string; tier: string; cap_usd: number; expires_at: string;
    allowed_tools: string[]; rate_limit: { rpm: number; burst: number };
    ready_configs: Record<string, unknown>;
  }> {
    const r = await fetch(`${this.apiBase}/api/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!r.ok) throw new YAXError(`apply failed: ${r.status}`, "APPLY_FAILED");
    return r.json();
  }

  /** Fetch the ready-paste agent onboarding configs (public, no auth). */
  async getOnboardingConfigs(): Promise<unknown> {
    const r = await fetch(`${this.apiBase}/api/agent-onboard`);
    if (!r.ok) throw new YAXError(`agent-onboard failed: ${r.status}`, "ONBOARD_FAILED");
    return r.json();
  }

  /** Gateway health snapshot. */
  async getStatus(): Promise<unknown> {
    const r = await fetch(`${this.apiBase}/api/status`);
    if (!r.ok) throw new YAXError(`status failed: ${r.status}`, "STATUS_FAILED");
    return r.json();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Static verification helpers — mirror of yieldagentx402-verify, re-exported
// so users only need one dep.
// ──────────────────────────────────────────────────────────────────────────────

const enc = new TextEncoder();

function hexFromBytes(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const A = a.toLowerCase(); const B = b.toLowerCase();
  if (A.length !== B.length) return false;
  let d = 0;
  for (let i = 0; i < A.length; i++) d |= A.charCodeAt(i) ^ B.charCodeAt(i);
  return d === 0;
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return hexFromBytes(sig);
}

/**
 * Client-side verify a signed receipt. Computes HMAC over the canonical
 * (sorted-keys) JSON body and constant-time compares against the provided sig.
 */
export async function verifyReceipt(opts: {
  secret: string;
  receipt: Record<string, unknown> | string;
  signature: string;
}): Promise<{ ok: boolean; computed: string; provided: string }> {
  const body = typeof opts.receipt === "string"
    ? opts.receipt
    : JSON.stringify(opts.receipt, Object.keys(opts.receipt).sort());
  const sig = opts.signature.replace(/^hmac-sha256=/i, "").replace(/^0x/, "").toLowerCase();
  const computed = await hmacSha256Hex(opts.secret, body);
  return { ok: timingSafeEqualHex(computed, sig), computed, provided: sig };
}

/** Verify an incoming YAX webhook (X-YAX-Signature: hmac-sha256=<hex>). */
export async function verifyWebhook(opts: {
  secret: string;
  body: string | ArrayBuffer | Uint8Array;
  signature: string | Headers;
}): Promise<{ ok: boolean; computed: string; provided: string }> {
  let sigStr: string;
  if (opts.signature instanceof Headers) {
    sigStr = opts.signature.get("X-YAX-Signature") || opts.signature.get("x-yax-signature") || "";
  } else {
    sigStr = String(opts.signature || "");
  }
  const sig = sigStr.replace(/^hmac-sha256=/i, "").replace(/^0x/, "").toLowerCase();
  const bodyStr = typeof opts.body === "string" ? opts.body
    : opts.body instanceof Uint8Array ? new TextDecoder().decode(opts.body)
    : new TextDecoder().decode(new Uint8Array(opts.body));
  const computed = await hmacSha256Hex(opts.secret, bodyStr);
  return { ok: timingSafeEqualHex(computed, sig), computed, provided: sig };
}

export default YieldAgentX402;
