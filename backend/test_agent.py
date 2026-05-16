from agent import support_agent
from agentspan.agents import run

if __name__ == "__main__":
    result = run(support_agent, "test prompt")
    print(f"OUTPUT: {result.output}")
