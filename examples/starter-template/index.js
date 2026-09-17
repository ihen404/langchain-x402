import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { x402ScraperTool } from "@ihentrel/x402-scraper-langchain";
import dotenv from "dotenv";

dotenv.config();

async function runAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  });

  const tools = [x402ScraperTool];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: true,
  });

  console.log("🤖 Agent initialized with x402 micro-payment scraper tool.");

  const response = await executor.invoke({
    input: "Scrape the content from https://example.com and return the main body text.",
  });

  console.log("\n✅ Agent Result:\n", response.output);
}

runAgent().catch(console.error);
