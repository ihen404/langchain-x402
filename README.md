# ihen404-x402-langchain

LangChain integration tool for **HTTP 402 Paywalled Web Scraping** powered by Base USDC micro-payments.

Designed specifically for **Autonomous AI Agents**, trading bots, and market research agents that require programmatic, pay-per-request web access without credit cards or monthly API subscriptions.

---

## Features

- **Native LangChain Tool Integration:** Drop-in `X402WebScraperTool` for LangChain, LangGraph, and CrewAI agents.
- **Automated HTTP 402 Settlement:** Automatically handles $0.005 Base USDC micro-payment challenges via `X-Payment` headers.
- **Zero Friction for AI Agents:** Autonomous agents sign and settle transactions directly on Base L2 in milliseconds.

---

## Installation

```bash
pip install ihen404-x402-langchain
```

---

## Quickstart

```python
import os
from langchain_x402 import X402WebScraperTool
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI

# Initialize the 402-capable web scraper tool
scraper_tool = X402WebScraperTool(
    wallet_private_key=os.getenv("BASE_WALLET_PRIVATE_KEY"),
    rpc_url="[https://mainnet.base.org](https://mainnet.base.org)",
    max_price_per_scrape="0.005"  # Max USDC spend per request
)

llm = ChatOpenAI(model="gpt-4o", temperature=0)
agent = initialize_agent(
    tools=[scraper_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Agent autonomously handles HTTP 402 payment challenge if paywalled
response = agent.run("Fetch data from [https://api.x402service.com/scrape?url=https://example.com](https://api.x402service.com/scrape?url=https://example.com)")
print(response)
```

---

## Pricing Structure

| Action | Cost | Settlement Network |
| :--- | :--- | :--- |
| Standard Web Scrape | **$0.005 USDC** | Base (L2) |
| Failed Request | **$0.000 USDC** | N/A |

---

## License

MIT License. Developed by [@ihen404](https://github.com/ihen404).
