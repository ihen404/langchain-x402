import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scrapeUrl } from "./index.js";

/**
 * LangChain tool wrapper for x402 web scraper.
 * Automatically handles HTTP 402 payment negotiation and Base mainnet USDC settlement.
 */
export const x402ScraperTool = new DynamicStructuredTool({
  name: "x402_web_scraper",
  description: "Scrapes web content from a target URL. Automatically handles HTTP 402 micro-payments on Base mainnet using USDC.",
  schema: z.object({
    targetUrl: z.string().url().describe("The URL of the web page to scrape.")
  }),
  func: async ({ targetUrl }) => {
    try {
      const result = await scrapeUrl(targetUrl);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error.message || "Failed to execute x402 web scrape."
      });
    }
  }
});
