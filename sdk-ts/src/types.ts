// Typed interfaces for every YieldAgentX402 MCP tool response.
// Mirrors the outputSchema fields each tool returns from the gateway.

export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "succeeded"
  | "success"
  | "failed"
  | "error"
  | "escalated"
  | "denied";

export interface Proof {
  filecoin_cid?: string | null;
  btfs_cid?: string | null;
}

export interface PolicyDecision {
  result?: string;
  version?: string;
  shade_guard?: string;
}

export interface CapabilitiesResponse {
  ok: boolean;
  platform: string;
  tagline?: string;
  proof_points?: string[];
  differentiators?: Array<{ title: string; detail: string; check_with?: string }>;
  security?: Record<string, unknown>;
  tool_categories?: Array<{ category: string; tools: string[]; when_to_use?: string }>;
  getting_started?: Record<string, string>;
  rate_limits?: Record<string, unknown>;
  idempotency?: { supported_on: string[]; pass_via: string; window: string; replay_response: string };
  fees?: { protocol_fee_bps: number; description: string; rails_routed: string[] };
  onboarding?: Record<string, string>;
}

export interface ShadeAgentManifest {
  custody_model: string;
  key_authority: string | null;
  attestation: string | null;
  addresses: { evm?: string | null; bitcoin?: string | null; starknet?: string | null };
  derivation_paths: { evm?: string; bitcoin?: string };
  supported_chains: string[];
}

export interface WalletStatusResponse {
  ok: boolean;
  demo_mode?: boolean;
  agent_id: string | null;
  agent_name: string | null;
  balance_usdc: string;
  spend_cap_usd: number;
  cap_remaining_usd: number;
  custody: string;
  wallet_address: string | null;
  plan: string | null;
  shade_agent: ShadeAgentManifest | null;
  note?: string;
}

export interface RunSecureWorkflowArgs {
  intent: string;
  action_type: "api_call" | "payment" | "email" | "on_chain" | "data_read" | "workflow";
  parameters?: Record<string, unknown>;
  spend_cap_override?: number;
  webhook_url?: string;
}

export interface RunSecureWorkflowResponse {
  ok: boolean;
  run_id: string | null;
  status: RunStatus;
  workflow_id: string;
  policy?: PolicyDecision;
  tee_attestation?: string | null;
  proof?: Proof | null;
  receipt_signature?: string | null;
  anchored_at?: string | null;
  webhook?: {
    registered: boolean;
    url: string;
    delivery: string;
    verify_with: string;
    retry_policy: string;
  } | null;
}

export interface ProcessX402PaymentArgs {
  recipient: string;
  amount: string;
  token?: string;
  memo?: string;
  /** Pass via arg OR X-Idempotency-Key header. Dedupes 24h per (api_key, key). */
  idempotency_key?: string;
}

export interface PaymentReceipt {
  ok: boolean;
  run_id: string | null;
  tx_hash: string | null;
  status: RunStatus;
  proof?: Proof | null;
  receipt_signature?: string | null;
  anchored_at?: string | null;
  idempotency_key?: string | null;
  idempotency_replay?: boolean;
}

export interface CheckPolicyArgs {
  action_type: string;
  parameters?: { amount?: string | number; token?: string; toToken?: string; chain?: string };
  intent?: string;
}

export interface PolicyCheckResponse {
  ok: boolean;
  decision: "approved" | "denied" | "escalated";
  policy_version: string;
  shade_guard: string;
  cap_remaining_usd?: number;
  requires_approval?: boolean;
  simulated_route?: unknown[];
}

export interface ReceiptResponse {
  ok: boolean;
  run_id: string;
  status: RunStatus;
  policy?: PolicyDecision | null;
  tee_attestation?: string | null;
  proof?: Proof | null;
  receipt_signature?: string | null;
  anchored_at?: string | null;
  input_hash?: string | null;
  output_hash?: string | null;
  approval_identity?: string | null;
}

export interface VerifyReceiptResponse {
  ok: boolean;
  run_id: string;
  verified: boolean;
  signature_ok: boolean;
  anchor_exists: boolean;
  filecoin_cid?: string | null;
}

export interface ListRunsResponse {
  ok: boolean;
  runs: Array<{
    id: string;
    status: RunStatus;
    workflow_id?: string;
    created_at?: string;
    policy?: PolicyDecision;
  }>;
  total?: number;
}

export interface AttestationResponse {
  ok: boolean;
  status: string;
  enclave_hash: string | null;
  last_attestation: string | null;
  tee_provider: string;
  configured: boolean;
}

/** Generic catch-all for tool responses we surface but don't strictly type. */
export interface GenericToolResponse {
  ok: boolean;
  [key: string]: unknown;
}

export type ToolErrorCode =
  | "MISSING_PARAM"
  | "UNAUTHORIZED"
  | "POLICY_ERROR"
  | "PAYMENT_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INVALID_WEBHOOK"
  | "EXECUTION_ERROR"
  | "AGENT_ERROR"
  | string;

export class YAXError extends Error {
  code: ToolErrorCode;
  hint?: string;
  rpcCode?: number;
  raw?: unknown;
  constructor(message: string, code: ToolErrorCode = "UNKNOWN", opts: { hint?: string; rpcCode?: number; raw?: unknown } = {}) {
    super(message);
    this.name = "YAXError";
    this.code = code;
    this.hint = opts.hint;
    this.rpcCode = opts.rpcCode;
    this.raw = opts.raw;
  }
}
