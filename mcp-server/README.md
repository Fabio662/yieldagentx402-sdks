# agentx402-mcp-server

> **Policy-gated, receipt-backed x402 execution for AI agents** — ShadeGuard before funds move, TEE-attested runs, verifiable proof.
> Thin stdio wrapper for the live YieldAgentX402 MCP endpoint.
>
> **Proof:** 18 tools · 18 chains · no custody · signed receipts on every call.

[Docs](https://yieldagentx402.app/mcp-server) · [Try without signup](#try-it-now-no-signup) · [Get API Key](https://yieldagentx402.app/apply) · [What is x402?](https://yieldagentx402.app/what-is-x402)

[![yieldagentx402-sdks MCP server](https://glama.ai/mcp/servers/Fabio662/yieldagentx402-sdks/badges/score.svg)](https://glama.ai/mcp/servers/Fabio662/yieldagentx402-sdks)

---

## Try it now (no signup)

The `yax_get_capabilities` tool is **public** — you can discover everything before you ever sign up.

```bash
curl -X POST https://api.yieldagentx402.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"yax_get_capabilities","arguments":{}}}'
```

Returns: differentiators (pitch), proof_points (18 tools · 18 chains · no custody · signed receipts), security posture, and live infra status.

---

## Install (1 minute)

Works with **Claude Desktop, Claude Code, Cursor, Windsurf, Zed,** and any MCP 2025-03-26 stdio client.

```json
{
  "mcpServers": {
    "yieldagentx402": {
      "command": "npx",
      "args": ["-y", "agentx402-mcp-server"],
      "env": {
        "YAX_API_KEY": "yax_live_...",
        "YAX_AGENT_ID": "optional-agent-id"
      }
    }
  }
}
```

Get an API key at **https://yieldagentx402.app/apply** (or call `POST /api/agent-onboard` for instant demo credentials).

---

## Tools (18)

| Category | Tools |
|---|---|
| **Discovery** *(public, no auth)* | `yax_get_capabilities` |
| **Wallet & custody** | `yax_get_wallet_status` |
| **Execution** | `yax_run_secure_workflow`, `yax_process_x402_payment` |
| **Policy & governance** | `yax_check_policy`, `yax_submit_approval`, `yax_control_workflow`, `yax_audit_compliance`, `yax_get_attestation` |
| **Receipts & audit** | `yax_get_receipt`, `yax_verify_receipt`, `yax_list_runs` |
| **Workflows** | `yax_score_leads`, `yax_enrich_lead_data`, `yax_build_email_sequence`, `yax_monitor_churn_risk`, `yax_collect_ar_invoices`, `yax_forecast_cash_flow` |

Every tool call is:
- **ShadeGuard-policy-checked** before execution
- **TEE-attested** (Intel TDX, NEAR AI Cloud — `mrEnclave` verifiable at [`/api/tee/report`](https://api.yieldagentx402.app/api/tee/report))
- **Receipt-backed** (HMAC-SHA256 over canonical JSON)
- **Filecoin + BTFS anchored** when uploads succeed
- **Routed across 18 networks** including Base, Ethereum, Bitcoin (native), Starknet, NEAR, Solana, Stacks, BNB, Rootstock, Filecoin, Aptos, Sui, TON, Tron, XRPL, Stellar, Algorand

## Custody-free wallet — one MPC key, three chains

The Shade Agent (NEAR chain signatures) derives payment addresses **on demand** — no private keys held anywhere.

| Chain | Address | Mode |
|---|---|---|
| EVM (Base/Eth) | `0x6905D04C3655625F6171f7b1e801a9325B1Fa1e8` | MPC-signed |
| Bitcoin (P2WPKH) | `bc1qcd8ljsj7x0rq3sw7drrt7ragqmmt3tfsfxs6gy` | MPC-signed |
| Starknet | `0x003a4e08…570906a21` | Stark curve, preset |

Live manifest: https://shade-agent-worker.cryptoblac.workers.dev/api/wallet

---

## Configuration

| Env var | Required | Default |
|---|---|---|
| `YAX_API_KEY` | Yes (for non-public tools) | — |
| `YAX_AGENT_ID` | No | — |
| `YAX_MCP_ENDPOINT` | No | `https://api.yieldagentx402.app/mcp` |
| `YAX_API_BASE` | No | (sets endpoint if `YAX_MCP_ENDPOINT` unset) |

---

## Registry

- **Official MCP Registry:** `io.github.Fabio662/yieldagentx402` **v1.0.4**
- **Glama:** [Fabio662/yieldagentx402-sdks](https://glama.ai/mcp/servers/Fabio662/yieldagentx402-sdks) — release **0.1.2**, tool quality scored
- **npm:** `agentx402-mcp-server@1.0.4` (this package)
- **Smithery:** [`fabianjefferson2/agentx402-mcp-server`](https://smithery.ai/servers/fabianjefferson2/agentx402-mcp-server)
- **Remote endpoint:** `https://api.yieldagentx402.app/mcp` (Streamable HTTP, MCP 2025-03-26)
- **x402scan:** [server/ddec8170…](https://www.x402scan.com/server/ddec8170-b8be-406e-98bb-b67a32c8a4c0)
- **Status:** [api.yieldagentx402.app/api/status](https://api.yieldagentx402.app/api/status)

---

## Development

```bash
npm install
npm run build
npm start
```

The package is intentionally thin. Tool discovery and tool calls are provided by the public YieldAgentX402 MCP endpoint, so the local package stays truthful as the hosted server evolves.

---

## License

MIT
