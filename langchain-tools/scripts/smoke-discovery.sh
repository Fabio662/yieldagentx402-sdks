#!/usr/bin/env bash
# Smoke-test MCP discovery without Python (avoids CLT Python SSL issues).
set -euo pipefail
BASE="${YAX_API_BASE:-https://api.yieldagentx402.app}"
curl -sS -f -X POST "${BASE%/}/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"yax_get_capabilities","arguments":{}}}' \
  | head -c 600
echo ""
