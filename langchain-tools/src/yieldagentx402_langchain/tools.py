import json
from typing import Any, Dict, Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from .client import YieldAgentMcpClient


class EmptyInput(BaseModel):
    """No arguments required."""


class PolicyPreviewInput(BaseModel):
    action_type: str = Field(
        ...,
        description="Action category: api_call, payment, email, on_chain, data_read, or workflow.",
    )
    parameters_json: str = Field(
        default="{}",
        description='JSON object of action parameters, e.g. {"amount":"10","chain":"base"}.',
    )
    intent: Optional[str] = Field(
        default=None,
        description="Optional human-readable intent string for the policy engine.",
    )


class ReceiptVerifyInput(BaseModel):
    run_id: str = Field(..., description="Run ID returned by a governed workflow or payment tool.")


class YieldAgentX402DiscoveryTool(BaseTool):
    name: str = "yieldagentx402_discovery"
    description: str = (
        "Fetch YieldAgentX402 platform capabilities (public, no API key): differentiators, "
        "proof_points, rate_limits, fees, streaming, and onboarding URLs."
    )
    args_schema: Type[BaseModel] = EmptyInput
    mcp_client: Optional[YieldAgentMcpClient] = None

    def _run(self) -> str:
        client = self.mcp_client or YieldAgentMcpClient()
        result = client.call_tool("yax_get_capabilities", {})
        return json.dumps(result, indent=2, sort_keys=True)


class YieldAgentX402PolicyPreviewTool(BaseTool):
    name: str = "yieldagentx402_policy_preview"
    description: str = (
        "Dry-run ShadeGuard policy for an intended action before execution. "
        "Requires YAX_API_KEY (or a demo/test key from POST /api/apply)."
    )
    args_schema: Type[BaseModel] = PolicyPreviewInput
    mcp_client: Optional[YieldAgentMcpClient] = None

    def _run(
        self,
        action_type: str,
        parameters_json: str = "{}",
        intent: Optional[str] = None,
    ) -> str:
        try:
            parameters: Dict[str, Any] = json.loads(parameters_json) if parameters_json else {}
        except json.JSONDecodeError as exc:
            raise ValueError("parameters_json must be valid JSON object") from exc
        if not isinstance(parameters, dict):
            raise ValueError("parameters_json must decode to a JSON object")
        args: Dict[str, Any] = {"action_type": action_type, "parameters": parameters}
        if intent:
            args["intent"] = intent
        client = self.mcp_client or YieldAgentMcpClient()
        result = client.call_tool("yax_check_policy", args)
        return json.dumps(result, indent=2, sort_keys=True)


class YieldAgentX402ReceiptVerifierTool(BaseTool):
    name: str = "yieldagentx402_receipt_verify"
    description: str = (
        "Verify a signed YieldAgentX402 receipt by run_id (signature + Filecoin anchor status)."
    )
    args_schema: Type[BaseModel] = ReceiptVerifyInput
    mcp_client: Optional[YieldAgentMcpClient] = None

    def _run(self, run_id: str) -> str:
        client = self.mcp_client or YieldAgentMcpClient()
        result = client.call_tool("yax_verify_receipt", {"run_id": run_id.strip()})
        return json.dumps(result, indent=2, sort_keys=True)


class YieldAgentX402ActionPlannerTool(BaseTool):
    name: str = "yieldagentx402_action_planner"
    description: str = (
        "Return the recommended getting_started sequence and tool categories from "
        "yax_get_capabilities — use before chaining other YieldAgent tools."
    )
    args_schema: Type[BaseModel] = EmptyInput
    mcp_client: Optional[YieldAgentMcpClient] = None

    def _run(self) -> str:
        client = self.mcp_client or YieldAgentMcpClient()
        caps = client.call_tool("yax_get_capabilities", {})
        plan = {
            "platform": caps.get("platform"),
            "tagline": caps.get("tagline"),
            "proof_points": caps.get("proof_points"),
            "getting_started": caps.get("getting_started"),
            "tool_categories": caps.get("tool_categories"),
            "onboarding": caps.get("onboarding"),
        }
        return json.dumps(plan, indent=2, sort_keys=True)
