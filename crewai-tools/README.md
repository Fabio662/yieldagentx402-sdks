# crewai-yieldagentx402-tools

> CrewAI tools for **YieldAgentX402** — custody-free, policy-gated, receipt-backed execution across 18 chains.

[Docs](https://yieldagentx402.app/mcp-server) · [Try without signup](#try-without-signup) · [Get API key](https://yieldagentx402.app/apply) · [PyPI](https://pypi.org/project/crewai-yieldagentx402-tools/)

---

## What it does

Drop these tools into your CrewAI crews to give them:

- **Policy dry-run** — preview what ShadeGuard will allow before any action runs
- **x402 payments** — send USDC, BTC, NEAR, SOL and 14+ other chains custody-free
- **Secure workflows** — Intel TDX TEE-attested execution with signed receipts
- **Receipt verification** — HMAC-SHA256 + Filecoin + BTFS dual-anchor proof
- **Shade Agent wallet** — read MPC-derived EVM + BTC + Starknet addresses

Every tool returns a `run_id` and `receipt_signature` you can verify client-side with `yieldagentx402-verify` (JavaScript) or the gateway's `/api/orchestration/runs/<run_id>` endpoint.

---

## Try without signup

```bash
curl -X POST https://api.yieldagentx402.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"yax_get_capabilities","arguments":{}}}'
```

Returns all 16 tools, 18 chains, fees, rate limits — no auth required.

Want an instant test key?

```bash
curl -X POST https://api.yieldagentx402.app/api/apply \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"my-crewai-agent"}'
```

Returns a `yax_test_*` key in <1 s ($5 cap, 7-day expiry).

---

## Install

```bash
pip install crewai-yieldagentx402-tools
```

## Quickstart

```python
from crewai import Agent, Task, Crew
from crewai_yieldagentx402_tools import (
    YAXPolicyCheckTool,
    YAXPaymentTool,
    YAXSecureWorkflowTool,
    YAXReceiptVerifyTool,
)

import os
os.environ["YAX_API_KEY"] = "yax_test_..."   # or yax_live_... for production

finance_agent = Agent(
    role="Finance Operations",
    goal="Pay invoices on time and verify every settlement on-chain",
    tools=[
        YAXPolicyCheckTool(),
        YAXPaymentTool(),
        YAXReceiptVerifyTool(),
    ],
    verbose=True,
)

task = Task(
    description="Pay invoice INV-9931 — 50 USDC to 0xMerchantAddress on Base. Confirm receipt.",
    agent=finance_agent,
)

Crew(agents=[finance_agent], tasks=[task]).kickoff()
```

The agent will:
1. Call `YAXPolicyCheckTool` to dry-run the action against ShadeGuard
2. Call `YAXPaymentTool` (if approved) to send the payment via the gateway
3. Call `YAXReceiptVerifyTool` with the returned `run_id` to confirm HMAC signature + Filecoin anchor

No private keys held anywhere in your crew. The Shade Agent (NEAR chain signatures MPC) signs inside a TEE.

---

## Custody-free wallet — one MPC key, three chains

| Chain | Address | Curve |
|---|---|---|
| EVM (Base/Eth) | `0x6905D04C3655625F6171f7b1e801a9325B1Fa1e8` | secp256k1 (MPC) |
| Bitcoin (P2WPKH) | `bc1qcd8ljsj7x0rq3sw7drrt7ragqmmt3tfsfxs6gy` | secp256k1 (MPC) |
| Starknet | `0x003a4e08…570906a21` | Stark (preset) |

Live: https://shade-agent-worker.cryptoblac.workers.dev/api/wallet

---

## Receipt verification (client-side, no trust in the gateway)

```python
import hmac, hashlib, json

def verify_receipt(receipt: dict, signature: str, secret: str) -> bool:
    body = json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    sig = signature.lower().removeprefix("hmac-sha256=").removeprefix("0x")
    return hmac.compare_digest(expected, sig)
```

Or use the JavaScript companion lib: [`yieldagentx402-verify`](https://www.npmjs.com/package/yieldagentx402-verify).

---

## Examples

See `examples/`:
- `managed_workflow.py` — full payment + verification flow
- `real_estate_lead_agent.py` — lead scoring + nurture sequence

---

## Configuration

| Env var | Required | Default |
|---|---|---|
| `YAX_API_KEY` | Yes (production keys for live workflows) | — |
| `YAX_API_BASE` | No | `https://api.yieldagentx402.app` |
| `YAX_AGENT_ID` | No | inferred from API key |
| `YAX_WEBHOOK_SECRET` | No (only if you use webhook delivery) | — |

---

## Publishing (for maintainers)

```bash
pip install build twine
python -m build
twine upload dist/*
```

---

## License

MIT
