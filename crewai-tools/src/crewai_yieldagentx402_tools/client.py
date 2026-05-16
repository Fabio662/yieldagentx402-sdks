import os
from typing import Any, Dict, Optional

import requests


class YieldAgentClientError(RuntimeError):
    """Raised when the YieldAgentX402 API returns an error response."""


class YieldAgentClient:
    def __init__(
        self,
        api_base: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        self.api_base = (api_base or os.getenv("YAX_API_BASE") or "https://api.yieldagentx402.app").rstrip("/")
        self.api_key = api_key if api_key is not None else os.getenv("YAX_API_KEY")
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "user-agent": "crewai-yieldagentx402-tools/0.1.0",
        }
        if self.api_key:
            headers["authorization"] = f"Bearer {self.api_key}"
        return headers

    def request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any]:
        if not path.startswith("/"):
            path = "/" + path
        response = requests.request(
            method.upper(),
            self.api_base + path,
            headers=self._headers(),
            timeout=self.timeout,
            **kwargs,
        )
        content_type = response.headers.get("content-type", "")
        body: Any
        if "application/json" in content_type:
            body = response.json()
        else:
            body = {"text": response.text}
        if response.status_code >= 400:
            raise YieldAgentClientError(f"{response.status_code} from {path}: {body}")
        if isinstance(body, dict):
            return body
        return {"data": body}

    def get(self, path: str) -> Dict[str, Any]:
        return self.request("GET", path)

    def post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.request("POST", path, json=payload)

    def verify_receipt(self, intent_id: str) -> Dict[str, Any]:
        safe_id = str(intent_id).strip()
        if not safe_id:
            raise ValueError("intent_id is required")
        return self.get(f"/api/intents/{safe_id}/verify-artifact")

    def policy_check(self, payload: Dict[str, Any], path: str = "/api/adapters/plan") -> Dict[str, Any]:
        body = dict(payload)
        body.setdefault("dryRun", True)
        body.setdefault("policyOnly", True)
        return self.post(path, body)

    def execute_x402_action(self, payload: Dict[str, Any], path: str = "/api/adapters/plan") -> Dict[str, Any]:
        return self.post(path, payload)
