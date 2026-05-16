from crewai import Agent, Crew, Task

from crewai_yieldagentx402_tools import (
    YieldAgentPolicyCheckTool,
    YieldAgentReceiptTool,
)


policy_tool = YieldAgentPolicyCheckTool()
receipt_tool = YieldAgentReceiptTool()

operator = Agent(
    role="Managed Workflow Operator",
    goal="Prepare safe, approval-gated workflow actions and verify receipts before reporting success.",
    backstory="You run managed YieldAgentX402 workflows for clients and never mark work complete without evidence.",
    tools=[policy_tool, receipt_tool],
)

task = Task(
    description=(
        "Preview policy for a sample follow-up workflow, then explain what approval or receipt evidence would be required."
    ),
    expected_output="A concise operator note with policy status, approval requirement, and receipt expectations.",
    agent=operator,
)

crew = Crew(agents=[operator], tasks=[task])

if __name__ == "__main__":
    print(crew.kickoff())
