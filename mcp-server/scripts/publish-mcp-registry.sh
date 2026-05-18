#!/usr/bin/env bash
# Republish io.github.Fabio662/yieldagentx402 to the Official MCP Registry.
# See ../REGISTRY_PUBLISH.md — run `mcp-publisher login github` first (JWT expires quickly).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v mcp-publisher >/dev/null 2>&1; then
  echo "Install (no shell comments on this line):" >&2
  echo "  npm install -g @modelcontextprotocol/mcp-publisher" >&2
  exit 1
fi

PKG_VERSION="$(node -p "require('./package.json').version")"
SRV_VERSION="$(node -p "require('./server.json').version")"
if [[ "$PKG_VERSION" != "$SRV_VERSION" ]]; then
  echo "Version mismatch: package.json=$PKG_VERSION server.json=$SRV_VERSION" >&2
  exit 1
fi

if [[ "${MCP_REGISTRY_SKIP_LOGIN:-}" != "1" ]]; then
  echo "Step 1: Refresh registry auth (required if you see 401 / expired JWT)..."
  echo "  mcp-publisher login github"
  echo ""
  if ! mcp-publisher login github; then
    echo "Login failed. See REGISTRY_PUBLISH.md" >&2
    exit 1
  fi
fi

echo "Step 2: Publishing server.json (name io.github.Fabio662/yieldagentx402, version $SRV_VERSION)..."
echo "  repository: yieldagentx402-sdks / mcp-server"
echo "  npm: agentx402-mcp-server@$PKG_VERSION"
mcp-publisher publish

echo ""
echo "Verify (expect HTTP 200):"
echo "  https://registry.modelcontextprotocol.io/v0.1/servers/io.github.Fabio662%2Fyieldagentx402/versions/latest"
