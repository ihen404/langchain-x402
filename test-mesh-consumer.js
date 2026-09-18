import { x402ScraperTool } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

async function runMeshTest() {
  console.log(`[${new Date().toISOString()}] 🤖 Starting automated x402 mesh test...`);
  
  try {
    const targetUrl = process.env.TEST_TARGET_URL || "https://example.com";
    const result = await x402ScraperTool.invoke({ url: targetUrl });
    
    console.log(`[${new Date().toISOString()}] ✅ Settlement & Scrape successful:`);
    console.log(result.slice(0, 200) + "...\n");
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Mesh test execution failed:`, error.message);
  }
}

runMeshTest();
setInterval(runMeshTest, 10 * 60 * 1000);
