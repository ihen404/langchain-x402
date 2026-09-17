import { x402ScraperTool } from "./index.js";

export const x402AgentKitAction = {
  name: "x402_web_scraper",
  description: "Scrapes paywalled web content utilizing Base USDC HTTP 402 micro-settlements.",
  schema: x402ScraperTool.schema,
  invoke: async (args) => {
    return await x402ScraperTool.invoke(args);
  },
};

console.log("Coinbase AgentKit Action Provider wrapper initialized successfully.");
