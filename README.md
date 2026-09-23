# @ihentrel/x402-scraper-langchain

[![npm version](https://img.shields.io/npm/v/@ihentrel/x402-scraper-langchain.svg)](https://www.npmjs.com/package/@ihentrel/x402-scraper-langchain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network](https://img.shields.io/badge/Network-Base%20Sepolia%20%2F%20Mainnet-blue)](https://base.org)

Protocol-native web scraping utility tool engineered for autonomous AI agents, powered by **Coinbase AgentKit**, **LangChain**, and **x402 on-chain micro-settlements**.

---

## Key Features & Strategic Positioning

* **Zero API Keys Required**: Agents discover, pay, and execute scraping requests mid-task without unhandled API key exceptions or rate limits.
* **Predictable Operational Cost**: Flat **$0.02 USDC/request** settlement on Base, offering a transparent OpEx alternative to dynamic per-gigabyte proxy services.
* **Token-Optimized Markdown**: HTML, navigation boilerplate, and DOM elements are automatically stripped into clean, token-dense Markdown to reduce LLM context window costs.
* **Asynchronous Queue Resilience**: Underpinned by a decoupled `better-sqlite3` queue and `PM2` worker mesh to prevent payload failures under high concurrency.
* **Ecosystem Ready**: Native support for **Model Context Protocol (MCP)** manifests (`/mcp.json`) and **ERC-8004** identity registration on Base.

---

## Quickstart

### 1. Installation

```bash
npm install @ihentrel/x402-scraper-langchain @coinbase/agentkit @langchain/openai
```

### 2. Basic Agent Usage

```typescript
import { AgentKit, ViemWalletProvider, walletActionProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { x402ActionProvider } from "@ihentrel/x402-scraper-langchain";

async function main() {
  const agentKit = await AgentKit.from({
    actionProviders: [walletActionProvider(), x402ActionProvider()],
  });

  const tools = await getLangChainTools(agentKit);
  const agent = createReactAgent({
    llm: new ChatOpenAI({ modelName: "gpt-4o-mini" }),
    tools,
  });

  const response = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Use the x402 scraper tool to fetch data from https://api.example.com/x402-resource",
      },
    ],
  });

  console.log(response.messages[response.messages.length - 1].content);
}

main();
```

---

## Model Context Protocol (MCP) Integration

For drop-in compatibility with MCP clients (e.g., Claude Desktop, Cursor, CrewAI):

```json
{
  "mcpServers": {
    "x402-scraper": {
      "url": "https://raw.githubusercontent.com/ihen404/langchain-x402/main/mcp.json"
    }
  }
}
```

---

## On-Chain Verification

* **Network**: Base Mainnet / Base Sepolia
* **Protocol Standard**: ERC-8004 Agent Identity
* **Settlement Asset**: USDC ($0.02 / request)

---

## License

MIT © Ike Ambrose Hentrel II
