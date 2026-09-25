import dotenv from "dotenv";
dotenv.config();

// Import the package scraper class directly
import { X402ScraperClient } from "@ihentrel/x402-scraper-langchain";

async function run() {
  const client = new X402ScraperClient({
    privateKey: process.env.BASE_AGENT_PRIVATE_KEY,
    rpcUrl: "https://sepolia.base.org"
  });

  console.log("Initiating test request to local Base Sepolia x402 server...");
  const result = await client.scrape("http://localhost:3000/scrape");
  console.log("Scrape Result:", result);
}

run().catch(console.error);
