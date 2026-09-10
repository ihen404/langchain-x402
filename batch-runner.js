import { execSync } from "child_process";
import fs from "fs";

// List of target URLs to process in batch
const defaultUrls = [
  "https://news.ycombinator.com",
  "https://example.com",
  "https://httpbin.org/get"
];

// Read input file if provided (e.g. node batch-runner.js urls.json), otherwise use default list
const inputFile = process.argv[2];
let urlsToScrape = defaultUrls;

if (inputFile && fs.existsSync(inputFile)) {
  try {
    const fileData = fs.readFileSync(inputFile, "utf8");
    urlsToScrape = JSON.parse(fileData);
    console.log(`📋 Loaded ${urlsToScrape.length} target URLs from ${inputFile}`);
  } catch (err) {
    console.error(`❌ Failed to parse ${inputFile}. Ensure it is a valid JSON array of strings.`);
    process.exit(1);
  }
}

async function runBatch() {
  console.log(`🚀 Starting batch execution for ${urlsToScrape.length} targets...\n`);
  const results = [];

  for (let i = 0; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    console.log(`--------------------------------------------------`);
    console.log(`[Batch ${i + 1}/${urlsToScrape.length}] Processing: ${url}`);
    console.log(`--------------------------------------------------`);

    try {
      // Execute standalone agent-runner.js synchronously for isolated settlement execution
      const output = execSync(`node agent-runner.js "${url}"`, { encoding: "utf8" });
      console.log(output);
      results.push({ url, status: "success" });
    } catch (err) {
      console.error(`❌ Batch failed for ${url}:`, err.message);
      results.push({ url, status: "failed", error: err.message });
    }

    // Brief delay between batch requests to avoid nonce synchronization issues
    if (i < urlsToScrape.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log(`==================================================`);
  console.log(`✨ Batch Scraping Completed!`);
  console.log(`Summary:`, results);
}

runBatch();
