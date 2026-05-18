import json
import os
import shutil
import subprocess
import sys
import warnings
from typing import Any, Dict, Optional

import requests
from requests.exceptions import SSLError


class YieldAgentMcpError(RuntimeError):
    """Raised when the YieldAgentX402 MCP endpoint returns an error."""


def _ssl_help_message() -> str:
    return (
        "HTTPS failed: your Python's SSL stack cannot negotiate TLS with api.yieldagentx402.app. "
        "This is common on macOS when using Command Line Tools Python 3.9 (LibreSSL 2.8.3). "
        "Fix: install a current Python and use a venv, e.g. "
        "brew install python@3.12 && python3.12 -m venv .venv && source .venv/bin/activate. "
        "Workaround: ensure curl is installed and set YAX_USE_CURL=1, or upgrade Python so requests works."
    )


class YieldAgentMcpClient:
    """Thin JSON-RPC client for https://api.yieldagentx402.app/mcp (Streamable HTTP)."""

    def __init__(
        self,
        mcp_base: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 60.0,
        use_curl: Optional[bool] = None,
    ) -> None:
        base = (mcp_base or os.getenv("YAX_MCP_BASE") or os.getenv("YAX_API_BASE") or "https://api.yieldagentx402.app").rstrip("/")
        self.mcp_url = f"{base}/mcp" if not base.endswith("/mcp") else base
        self.api_key = api_key if api_key is not None else os.getenv("YAX_API_KEY")
        self.timeout = timeout
        if use_curl is None:
            use_curl = os.getenv("YAX_USE_CURL", "").strip().lower() in ("1", "true", "yes")
        self.use_curl = use_curl

    def _headers(self) -> Dict[str, str]:
        # JSON-RPC tool calls must not ask for SSE or the gateway returns event: lines.
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "user-agent": "yieldagentx402-langchain/0.1.3",
        }
        if self.api_key:
            headers["authorization"] = f"Bearer {self.api_key}"
        return headers

    @staticmethod
    def _parse_http_body(raw: str) -> Dict[str, Any]:
        text = (raw or "").strip()
        if not text:
            raise YieldAgentMcpError("Empty response from MCP endpoint")
        if text.startswith("event:") or text.startswith("data:"):
            for line in text.splitlines():
                if line.startswith("data:"):
                    payload = line[5:].strip()
                    if payload:
                        return json.loads(payload)
            raise YieldAgentMcpError("SSE response had no data: line")
        return json.loads(text)

    @staticmethod
    def _parse_tool_result(data: Dict[str, Any]) -> Dict[str, Any]:
        if "error" in data:
            err = data["error"]
            raise YieldAgentMcpError(err.get("message") or str(err))
        result = data.get("result") or {}
        structured = result.get("structuredContent")
        if isinstance(structured, dict):
            return structured
        for block in result.get("content") or []:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text") or ""
                if text.strip().startswith("{"):
                    return json.loads(text)
        return result if isinstance(result, dict) else {"result": result}

    def _post_json_curl(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        curl_bin = shutil.which("curl")
        if not curl_bin:
            raise YieldAgentMcpError(_ssl_help_message() + " (curl not found on PATH)")

        args = [
            curl_bin,
            "-sS",
            "-f",
            "-X",
            "POST",
            self.mcp_url,
            "-H",
            "Content-Type: application/json",
            "-H",
            "Accept: application/json",
            "--max-time",
            str(max(1, int(self.timeout))),
            "-d",
            json.dumps(payload),
        ]
        if self.api_key:
            args.extend(["-H", f"Authorization: Bearer {self.api_key}"])

        try:
            proc = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=self.timeout + 10,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise YieldAgentMcpError(f"MCP request timed out after {self.timeout}s") from exc

        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "").strip()[:500]
            raise YieldAgentMcpError(f"curl MCP request failed (exit {proc.returncode}): {detail}")

        try:
            data = self._parse_http_body(proc.stdout)
        except json.JSONDecodeError as exc:
            raise YieldAgentMcpError(f"Invalid JSON from MCP: {proc.stdout[:300]}") from exc
        return self._parse_tool_result(data)

    def _post_json_requests(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            self.mcp_url,
            headers=self._headers(),
            json=payload,
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise YieldAgentMcpError(f"HTTP {response.status_code}: {response.text[:500]}")
        try:
            data = response.json()
        except json.JSONDecodeError:
            data = self._parse_http_body(response.text)
        return self._parse_tool_result(data)

    def call_tool(self, name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments or {}},
        }
        if self.use_curl:
            return self._post_json_curl(payload)

        try:
            return self._post_json_requests(payload)
        except SSLError as exc:
            if shutil.which("curl"):
                warnings.warn(
                    "Retrying MCP call via curl because Python SSL could not negotiate TLS "
                    f"(Python {sys.version.split()[0]} on {sys.platform}). "
                    "For a permanent fix use Python 3.11+ from python.org or Homebrew, not CLT Python 3.9.",
                    UserWarning,
                    stacklevel=2,
                )
                return self._post_json_curl(payload)
            raise YieldAgentMcpError(_ssl_help_message()) from exc
