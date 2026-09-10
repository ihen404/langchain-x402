import dotenv from "dotenv";
dotenv.config();

import { x402ScraperTool } from "./index.js";

async function main() {
  console.log(`🤖 Invoking LangChain Tool: ${x402ScraperTool.name}`);
  const response = await x402ScraperTool.invoke({ targetUrl: "https://example.com" });
  console.log("📄 Tool Execution Result:\n", response);
}

main().catch(console.error);
