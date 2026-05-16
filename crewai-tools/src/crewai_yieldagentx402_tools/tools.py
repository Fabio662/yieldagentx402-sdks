import json
from typing import Any, Dict, Optional, Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from .client import YieldAgentClient


def _loads(value: str) -> Dict[str, Any]:
    if not value:
        return {}
    parsed = json.loads(value)
    if not isinstance(parsed, dict):
        raise ValueError("payload must be a JSON object")
    return parsed


class PolicyCheckInput(BaseModel):
    payload_json: str = Field(
        ...,
        description="JSON object describing the intended action, amount, chain, adapter, workflow, and approval context.",
    )
    path: str = Field(
        "/api/adapters/plan",
        description="Gateway path used for policy preview or dry-run planning.",
    )


class X402ActionInput(BaseModel):
    payload_json: str = Field(
        ...,
        description="JSON object for the governed x402/action endpoint.",
    )
    path: str = Field(
        "/api/adapters/plan",
        description="Gateway path for the governed action. Use approval/dry-run modes for sensitive actions.",
    )


class ReceiptInput(BaseModel):
    intent_id: str = Field(..., description="Intent ID or run ID to verify.")


class YieldAgentPolicyCheckTool(BaseTool):
    name: str = "yieldagent_policy_check"
    description: str = (
        "Preview a YieldAgentX402 policy decision before execution. Use this before any action that may move value, "
        "send outreach, update systems, or require approval."
    )
    args_schema: Type[BaseModel] = PolicyCheckInput
    client: Optional[YieldAgentClient] = None

    def _run(self, payload_json: str, path: str = "/api/adapters/plan") -> str:
        client = self.client or YieldAgentClient()
        result = client.policy_check(_loads(payload_json), path=path)
        return json.dumps(result, indent=2, sort_keys=True)


class YieldAgentX402ActionTool(BaseTool):
    name: str = "yieldagent_x402_action"
    description: str = (
        "Submit a governed YieldAgentX402 action payload. Sensitive actions should be approval-gated and receipt-backed."
    )
    args_schema: Type[BaseModel] = X402ActionInput
    client: Optional[YieldAgentClient] = None

    def _run(self, payload_json: str, path: str = "/api/adapters/plan") -> str:
        client = self.client or YieldAgentClient()
        result = client.execute_x402_action(_loads(payload_json), path=path)
        return json.dumps(result, indent=2, sort_keys=True)


class YieldAgentReceiptTool(BaseTool):
    name: str = "yieldagent_receipt_verify"
    description: str = (
        "Verify a YieldAgentX402 receipt artifact by intent ID. Returns digest/evidence status and proof references."
    )
    args_schema: Type[BaseModel] = ReceiptInput
    client: Optional[YieldAgentClient] = None

    def _run(self, intent_id: str) -> str:
        client = self.client or YieldAgentClient()
        result = client.verify_receipt(intent_id)
        return json.dumps(result, indent=2, sort_keys=True)
