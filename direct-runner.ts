import dotenv from "dotenv";
dotenv.config();

import * as pkg from "@ihentrel/x402-scraper-langchain";

async function run() {
  console.log("Exported package keys:", Object.keys(pkg));
  
  // Instantiate default export or tool
  const ScraperClass = pkg.default || pkg.x402ScraperTool;
  
  if (typeof ScraperClass === "function") {
    const instance = new ScraperClass({
      privateKey: process.env.BASE_AGENT_PRIVATE_KEY,
      rpcUrl: "https://sepolia.base.org",
      usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    });

    console.log("🚀 Executing direct scrape against http://localhost:4000/scrape...");
    if (instance.invoke) {
      const res = await instance.invoke({ input: "http://localhost:4000/scrape" });
      console.log("Result:", res);
    } else if (instance.scrape) {
      const res = await instance.scrape("http://localhost:4000/scrape");
      console.log("Result:", res);
    } else {
      console.log("Instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    }
  }
}

run().catch(console.error);
