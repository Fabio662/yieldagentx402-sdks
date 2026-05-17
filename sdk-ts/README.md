# yieldagentx402

> **Typed TypeScript SDK** for YieldAgentX402 — custody-free, policy-gated, receipt-backed agent execution across 18 chains.
> Zero runtime deps. Works in Node 18+, browsers, Cloudflare Workers, Deno, Bun.

[Docs](https://yieldagentx402.app/mcp-server) · [Try without signup](#try-without-signup) · [Get API key](https://yieldagentx402.app/apply) · [npm](https://www.npmjs.com/package/yieldagentx402)

---

## Install

```bash
npm install yieldagentx402
```

## Try without signup

```ts
import { YieldAgentX402 } from "yieldagentx402";

const yax = new YieldAgentX402(); // no API key needed
const caps = await yax.getCapabilities();

console.log(caps.platform);      // "YieldAgentX402"
console.log(caps.proof_points);  // ["16 tools", "18 chains", "no custody", "signed receipts"]
console.log(caps.fees);          // { protocol_fee_bps: 25, ... }
```

Want an instant test key (5 USD cap, 7-day expiry)?

```ts
const { api_key } = await yax.applyForTestKey({ agent_name: "my-agent" });
const yaxAuthed = new YieldAgentX402({ apiKey: api_key });
const wallet = await yaxAuthed.getWalletStatus();
```

## Production usage

```ts
import { YieldAgentX402 } from "yieldagentx402";

const yax = new YieldAgentX402({
  apiKey: process.env.YAX_API_KEY!,   // yax_live_...
  agentId: process.env.YAX_AGENT_ID,  // optional
});

// 1. Discover custody-free MPC wallet addresses
const wallet = await yax.getWalletStatus();
console.log(wallet.shade_agent?.addresses);
// { evm: "0x6905...", bitcoin: "bc1q...", starknet: "0x003a..." }

// 2. Dry-run policy before any destructive action
const policy = await yax.checkPolicy({
  action_type: "payment",
  parameters: { amount: "50", token: "USDC", chain: "base" },
});
if (policy.decision !== "approved") throw new Error(`Denied: ${policy.shade_guard}`);

// 3. Run the actual payment with idempotency
const tx = await yax.processX402Payment({
  recipient: "0xMerchantAddress",
  amount: "50.00",
  token: "USDC",
  idempotency_key: `invoice-9931-${Date.now()}`,  // safe retries
});

// 4. Verify the receipt server-side
const verified = await yax.verifyReceipt(tx.run_id!);
console.log(verified);  // { verified: true, signature_ok: true, anchor_exists: true, ... }
```

## Stream workflow progress (SSE, no polling)

For long-running workflows, get real-time progress events instead of polling:

```ts
for await (const ev of yax.streamSecureWorkflow({
  intent: "Pay 50 USDC to 0xMerchant on Base",
  action_type: "payment",
})) {
  if (ev.type === "progress") console.log(ev.stage, ev.run_id ?? "");
  if (ev.type === "result")   console.log("✓ done:", ev.result.run_id, ev.result.receipt_signature);
  if (ev.type === "error")    console.error("✗", ev.message);
}
```

Stages: `queued → policy_checking → policy_approved → tee_executing → signing → anchoring → completed`.

Uses MCP 2025-03-26 Streamable HTTP under the hood (`Accept: text/event-stream`).

## Webhook callbacks (kill polling)

Provide a `webhook_url` and YAX POSTs the signed receipt when the run completes:

```ts
await yax.runSecureWorkflow({
  intent: "Send invoice follow-up to client ABC",
  action_type: "email",
  webhook_url: "https://your-app.com/yax-webhook",
});
```

Then verify the incoming POST in your handler — zero deps:

```ts
import { verifyWebhook } from "yieldagentx402";

// in your Hono/Express/Fastify/Worker handler:
const body = await request.text();
const result = await verifyWebhook({
  secret:    process.env.YAX_WEBHOOK_SECRET!,
  body,
  signature: request.headers,  // pass Headers directly
});
if (!result.ok) return new Response("invalid sig", { status: 401 });
const event = JSON.parse(body);  // { event, run_id, status, receipt_signature, ... }
```

## Client-side receipt verification

Don't trust the gateway — verify HMAC + Filecoin anchor yourself:

```ts
import { verifyReceipt } from "yieldagentx402";

const receipt = await yax.getReceipt(runId);
const result = await verifyReceipt({
  secret:    process.env.YAX_WEBHOOK_SECRET!,
  receipt,
  signature: receipt.receipt_signature!,
});
console.log(result.ok ? "✓ genuine" : "✗ tampered");
```

## All 16 tools, typed

| Method | MCP tool |
|---|---|
| `getCapabilities()` | `yax_get_capabilities` (public) |
| `getWalletStatus()` | `yax_get_wallet_status` |
| `getShadeAgentWallet()` | direct fetch of MPC manifest |
| `runSecureWorkflow(args)` | `yax_run_secure_workflow` |
| `processX402Payment(args)` | `yax_process_x402_payment` |
| `checkPolicy(args)` | `yax_check_policy` |
| `getAttestation()` | `yax_get_attestation` |
| `getReceipt(runId)` | `yax_get_receipt` |
| `verifyReceipt(runId)` | `yax_verify_receipt` (server-side) |
| `listRuns(opts)` | `yax_list_runs` |
| `scoreLeads(args)` | `yax_score_leads` |
| `enrichLead(args)` | `yax_enrich_lead_data` |
| `buildEmailSequence(args)` | `yax_build_email_sequence` |
| `monitorChurnRisk(args)` | `yax_monitor_churn_risk` |
| `collectARInvoices(args)` | `yax_collect_ar_invoices` |
| `forecastCashFlow(args)` | `yax_forecast_cash_flow` |
| `auditCompliance(args)` | `yax_audit_compliance` |

Plus REST helpers: `applyForTestKey()`, `getOnboardingConfigs()`, `getStatus()`.

## Custody-free wallet — one MPC key, three chains

| Chain | Address | Curve |
|---|---|---|
| EVM (Base/Eth) | `0x6905D04C3655625F6171f7b1e801a9325B1Fa1e8` | secp256k1 (MPC) |
| Bitcoin (P2WPKH) | `bc1qcd8ljsj7x0rq3sw7drrt7ragqmmt3tfsfxs6gy` | secp256k1 (MPC) |
| Starknet | `0x003a4e08…570906a21` | Stark (preset) |

No private keys held anywhere. Every signature requires fresh NEAR chain-signatures MPC quorum inside an Intel TDX TEE.

## Error handling

All tool errors throw a typed `YAXError`:

```ts
import { YieldAgentX402, YAXError } from "yieldagentx402";

try {
  await yax.processX402Payment({ recipient: "0x...", amount: "1.00" });
} catch (err) {
  if (err instanceof YAXError) {
    console.log(err.code);  // "PAYMENT_ERROR", "UNAUTHORIZED", "MISSING_PARAM", ...
    console.log(err.hint);  // actionable hint if provided
    console.log(err.raw);   // full tool response
  }
}
```

## Configuration

```ts
new YieldAgentX402({
  apiKey:     "yax_live_...",                          // omit for public discovery only
  agentId:    "agent_abc",                             // optional, scopes to one agent
  endpoint:   "https://api.yieldagentx402.app/mcp",    // override MCP endpoint
  apiBase:    "https://api.yieldagentx402.app",        // for REST helpers
  maxRetries: 2,                                       // 429 retries with Retry-After
  fetchInit:  { signal: AbortSignal.timeout(15000) },  // default fetch opts
});
```

## Environments

- **Node 18+** ✓
- **Browsers** ✓ (uses fetch + WebCrypto)
- **Cloudflare Workers** ✓
- **Deno** ✓
- **Bun** ✓

Zero runtime dependencies. No bundler config needed.

## Related packages

- [`agentx402-mcp-server`](https://www.npmjs.com/package/agentx402-mcp-server) — stdio MCP wrapper for Claude Desktop, Cursor, etc.
- [`yieldagentx402-verify`](https://www.npmjs.com/package/yieldagentx402-verify) — standalone verify lib (this SDK re-exports it)
- [`crewai-yieldagentx402-tools`](https://pypi.org/project/crewai-yieldagentx402-tools/) — CrewAI tools (Python)

## License

MIT
