import { X402ScraperClient } from "./index.js";
async function main() {
    console.log("🧪 Running x402 Scraper test runner...");
    const client = new X402ScraperClient("http://localhost:4000/scrape");
    console.log("Client initialized successfully:", !!client);
}
main().catch(console.error);
