import dotenv from "dotenv";
dotenv.config();

if (process.env.CDP_API_KEY_SECRET) {
  process.env.CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET.replace(/\\n/g, "\n");
}

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

import {
  AgentKit,
  CdpEvmWalletProvider,
  wethActionProvider,
  pythActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

import { customPriceActionProvider } from "./customActionProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WALLET_DATA_FILE = path.join(__dirname, "wallet_data.json");

async function main() {
  console.log("Starting AgentKit initialization...");

  let walletDataStr: string | undefined;

  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      console.log("Loaded existing wallet data from storage.");
    } catch (error) {
      console.error("Error reading wallet data:", error);
    }
  }

  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    cdpWalletData: walletDataStr,
    networkId: "base-sepolia",
  });

  const exportedWalletData = await walletProvider.exportWallet();
  fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWalletData, null, 2));

  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      wethActionProvider(),
      pythActionProvider(),
      erc20ActionProvider(),
      cdpApiActionProvider(),
      customPriceActionProvider(),
    ],
  });

  const tools = await getLangChainTools(agentKit);
  const memory = new MemorySaver();

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
  });

  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
  });

  const threadConfig = { configurable: { thread_id: "scheduled-session-1" } };

  // If running in headless GitHub Actions (CI) mode, execute scheduled task and exit
  if (process.env.CI === "true") {
    console.log("Running in CI mode: executing scheduled agent task...");
    const response = await agent.invoke(
      { messages: [{ role: "user", content: "Check wallet balance and output status." }] },
      threadConfig
    );
    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`\nAgent Execution Summary:\n${lastMessage.content}`);
    process.exit(0);
  }

  // Interactive CLI mode for local terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n============================================");
  console.log("  AgentKit CLI Interactive Chat Started");
  console.log("  Type 'exit' or 'quit' to end session.");
  console.log("============================================\n");

  const promptUser = () => {
    rl.question("\nYou > ", async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("Exiting chat. Goodbye!");
        rl.close();
        process.exit(0);
      }

      if (!trimmed) {
        promptUser();
        return;
      }

      try {
        const response = await agent.invoke(
          { messages: [{ role: "user", content: trimmed }] },
          threadConfig
        );

        const lastMessage = response.messages[response.messages.length - 1];
        console.log(`\nAgent > ${lastMessage.content}`);
      } catch (err) {
        console.error("Error processing prompt:", err);
      }

      promptUser();
    });
  };

  promptUser();
}

main().catch((err) => {
  console.error("Fatal Agent Execution Error:", err);
  process.exit(1);
});
