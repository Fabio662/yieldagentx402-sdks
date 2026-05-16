from crewai import Agent, Crew, Task

from crewai_yieldagentx402_tools import YieldAgentPolicyCheckTool


policy_tool = YieldAgentPolicyCheckTool()

real_estate_operator = Agent(
    role="Real Estate Lead Workflow Operator",
    goal="Research and prepare outreach with approval gates, opt-out awareness, and CRM-ready receipt notes.",
    backstory=(
        "You support agents, brokers, and wholesalers by preparing lead research and follow-up tasks. "
        "You do not send campaigns or make sensitive claims without approval."
    ),
    tools=[policy_tool],
)

task = Task(
    description=(
        "Given a lead list workflow, prepare the policy preview for researching leads, drafting follow-ups, "
        "booking appointments, and logging CRM updates. Highlight compliance gates."
    ),
    expected_output="A workflow plan with approval gates, compliance notes, and expected receipt fields.",
    agent=real_estate_operator,
)

crew = Crew(agents=[real_estate_operator], tasks=[task])

if __name__ == "__main__":
    print(crew.kickoff())
