# YieldAgentX402 SDKs

> Public client libraries and integrations for **YieldAgentX402** — the custody-free, policy-gated, receipt-backed execution layer for AI agents.

[Platform](https://yieldagentx402.app) · [MCP Docs](https://yieldagentx402.app/mcp-server) · [Try without signup](#try-without-signup) · [Get API key](https://yieldagentx402.app/apply)

This repo hosts the open-source distribution packages. The platform itself (gateway, ShadeGuard policy engine, TEE attestation, orchestrator, Filecoin/BTFS anchoring) lives in a separate private repository — we ship the bits agents need to *use* the platform here.

---

## Packages in this repo

| Package | Registry | What it does |
|---|---|---|
| [`sdk-ts/`](./sdk-ts) | npm: [`yieldagentx402`](https://www.npmjs.com/package/yieldagentx402) | **Typed TypeScript SDK.** Wraps all 16 MCP tools with first-class types, idempotency, webhook verify, Shade Agent helpers. Zero deps. Works in Node, browsers, Workers, Deno, Bun. |
| [`mcp-server/`](./mcp-server) | npm: [`agentx402-mcp-server`](https://www.npmjs.com/package/agentx402-mcp-server) | Stdio MCP wrapper. Drop into Claude Desktop / Code / Cursor / Windsurf to give any MCP client all 16 YieldAgentX402 tools across 18 chains. |
| [`verify-lib/`](./verify-lib) | npm: [`yieldagentx402-verify`](https://www.npmjs.com/package/yieldagentx402-verify) | Zero-dependency WebCrypto verifier for receipts + webhook signatures. Works in browser, Node 18+, Cloudflare Workers, Deno. |
| [`crewai-tools/`](./crewai-tools) | PyPI: [`crewai-yieldagentx402-tools`](https://pypi.org/project/crewai-yieldagentx402-tools/) | CrewAI tool wrappers — policy dry-run, x402 payment, secure workflow, receipt verify, Shade Agent MPC wallet status. |

---

## Try without signup

```bash
curl -X POST https://api.yieldagentx402.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"yax_get_capabilities","arguments":{}}}'
```

No API key required. Returns all 16 tools, 18 chains, rate limits, fees, supported runtime configs.

Want an instant test key?

```bash
curl -X POST https://api.yieldagentx402.app/api/apply \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"my-agent"}'
```

Returns a `yax_test_*` key (5 USD cap, 7-day expiry) for safe read-only tools.

---

## What is YieldAgentX402?

A trust layer for agents that move money.

- **16 MCP tools** — discovery, secure workflow execution, x402 payment settlement, policy dry-run, receipt verification, attestation, finance/CRM skill tools
- **18 chains** — Base, Ethereum, **Bitcoin (native)**, Starknet, NEAR, Solana, Stacks, BNB, Rootstock, Filecoin EVM + native, Aptos, Sui, TON, Tron, XRPL, Stellar, Algorand
- **Custody-free wallet** — one NEAR MPC key authority derives EVM + BTC addresses on demand. No private keys held by the gateway or worker. Starknet uses Stark curve preset.
- **Intel TDX TEE attestation** — mrEnclave verifiable at [`/api/tee/report`](https://api.yieldagentx402.app/api/tee/report)
- **HMAC-SHA256 receipts** — every call returns a signed receipt
- **Filecoin + BTFS dual anchoring** — permanent tamper-proof proof storage
- **x402 protocol settlement** — 0.25% protocol fee, machine-verifiable in `/.well-known/x402` as `extra.protocolFeeBps: 25`

---

## Custody-free wallet — one MPC key, three chains

| Chain | Address | Curve |
|---|---|---|
| EVM (Base/Eth) | `0x6905D04C3655625F6171f7b1e801a9325B1Fa1e8` | secp256k1 (MPC) |
| Bitcoin (P2WPKH) | `bc1qcd8ljsj7x0rq3sw7drrt7ragqmmt3tfsfxs6gy` | secp256k1 (MPC) |
| Starknet | `0x003a4e08…570906a21` | Stark (preset) |

Live manifest: https://shade-agent-worker.cryptoblac.workers.dev/api/wallet

---

## Live infra

| Surface | URL |
|---|---|
| MCP endpoint | https://api.yieldagentx402.app/mcp |
| Public discovery | `POST /mcp` with `yax_get_capabilities` (no auth) |
| Instant test key | `POST /api/apply` |
| Ready-to-paste configs | `GET /api/agent-onboard` |
| x402 manifest | https://api.yieldagentx402.app/.well-known/x402 |
| MCP manifest | https://api.yieldagentx402.app/.well-known/mcp.json |
| Status | https://api.yieldagentx402.app/api/status |
| TEE report | https://api.yieldagentx402.app/api/tee/report |
| Shade Agent wallet | https://shade-agent-worker.cryptoblac.workers.dev/api/wallet |
| Receipt verifier (UI) | https://yieldagentx402.app/verify |
| Postman collection | https://yieldagentx402.app/postman/yieldagentx402.postman_collection.json |

---

## Contributing

Issues and PRs on the public SDK packages are welcome here. Platform-level changes (gateway, policy engine, TEE worker) happen in a private repo — open an issue if you have a feature request and we'll triage.

---

## License

MIT — see [`LICENSE`](./LICENSE).
