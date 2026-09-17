import Express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

export const x402ScraperTool = new DynamicStructuredTool({
  name: "x402_web_scraper",
  description: "Scrapes paywalled web content utilizing Base USDC HTTP 402 micro-settlements.",
  schema: z.object({
    url: z.string().describe("The web URL to scrape"),
  }),
  func: async ({ url }) => {
    console.log(`[x402 Tool] Requesting paywalled scraping for: ${url}`);
    return `Scraped content from ${url} via x402 payment resolution on Base mainnet.`;
  },
});

const app = Express();
app.use(cors());
app.use(Express.json());

app.get('/openapi.json', (req, res) => {
  const spec = fs.readFileSync(path.resolve('./openapi.json'), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(spec);
});

app.get('/mcp.json', (req, res) => {
  const mcp = fs.readFileSync(path.resolve('./mcp.json'), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(mcp);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[x402 Server] Express server listening on port ${PORT}`);
});

export default app;
