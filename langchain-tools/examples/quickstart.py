"""Run: python examples/quickstart.py (from package root, with deps installed)."""

from yieldagentx402_langchain import (
    YieldAgentX402ActionPlannerTool,
    YieldAgentX402DiscoveryTool,
)

if __name__ == "__main__":
    print("=== Discovery (no API key) ===\n")
    print(YieldAgentX402DiscoveryTool().invoke({})[:2000], "...\n")
    print("\n=== Action planner ===\n")
    print(YieldAgentX402ActionPlannerTool().invoke({}))
