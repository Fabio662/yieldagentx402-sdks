# yieldagentx402-langchain

> LangChain tools for **YieldAgentX402** — policy-gated, receipt-backed agent execution (MCP gateway).

**PyPI:** `pip install yieldagentx402-langchain`  
**Import:** `yieldagentx402_langchain`

> **Note:** PyPI rejects third-party packages named `langchain-*` (403 Forbidden). This package uses the `yieldagentx402-langchain` name, same pattern as `crewai-yieldagentx402-tools`.

**Pitch:** LangChain agents plan; YieldAgentX402 executes with ShadeGuard, x402, and verifiable receipts.  
**Proof:** 16 tools · 18 chains · no custody · signed receipts.

[Docs](https://yieldagentx402.app/mcp-server) · [Try without signup](#try-without-signup) · [Get API key](https://yieldagentx402.app/apply) · [PyPI](https://pypi.org/project/yieldagentx402-langchain/)

## Install

```bash
pip install yieldagentx402-langchain
```

**From this repo (editable):**

```bash
python -m pip install -e .
python -c "import yieldagentx402_langchain; print('ok')"
```

## Try without signup

```python
from yieldagentx402_langchain import YieldAgentX402DiscoveryTool

print(YieldAgentX402DiscoveryTool().invoke({}))
```

## With an API key

```bash
export YAX_API_KEY=yax_test_...   # POST https://api.yieldagentx402.app/api/apply
```

```python
from yieldagentx402_langchain import (
    YieldAgentX402DiscoveryTool,
    YieldAgentX402PolicyPreviewTool,
    YieldAgentX402ReceiptVerifierTool,
)

print(YieldAgentX402PolicyPreviewTool().invoke({
    "action_type": "payment",
    "parameters_json": '{"amount": "1.00", "token": "USDC"}',
}))
```

## Tools

| Tool | MCP method | Auth |
|------|------------|------|
| `YieldAgentX402DiscoveryTool` | `yax_get_capabilities` | None |
| `YieldAgentX402ActionPlannerTool` | `yax_get_capabilities` (plan subset) | None |
| `YieldAgentX402PolicyPreviewTool` | `yax_check_policy` | `YAX_API_KEY` |
| `YieldAgentX402ReceiptVerifierTool` | `yax_verify_receipt` | `YAX_API_KEY` for some tenants |

## Environment

| Variable | Default |
|----------|---------|
| `YAX_API_KEY` | — |
| `YAX_API_BASE` / `YAX_MCP_BASE` | `https://api.yieldagentx402.app` |
| `YAX_USE_CURL` | `0` — force MCP HTTP via `curl` (macOS CLT Python 3.9) |

## Publish (maintainer)

```bash
export TWINE_USERNAME=__token__
export TWINE_PASSWORD='pypi-...'
./scripts/publish-pypi.sh
```

## Troubleshooting: `SSLError` on macOS

Use Python 3.11+ from Homebrew in a venv, or set `YAX_USE_CURL=1`. See prior README section / `scripts/smoke-discovery.sh`.
