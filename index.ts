import {
  AgentKit,
  ViemWalletProvider,
  walletActionProvider,
  erc20ActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

import { x402ActionProvider } from "./x402ActionProvider.js";

dotenv.config();

process.env.AGENTKIT_TELEMETRY_ENABLED = "false";
process.on("unhandledRejection", (reason) => {
  if (String(reason).includes("sendAnalyticsEvent") || String(reason).includes("HTTP error")) return;
  console.error("Unhandled Rejection:", reason);
});

const WALLET_KEY_FILE = "wallet_key.txt";

async function runAgent() {
  let privateKey: `0x${string}` | undefined;

  if (process.env.EVM_PRIVATE_KEY) {
    privateKey = process.env.EVM_PRIVATE_KEY.trim() as `0x${string}`;
  } else if (fs.existsSync(WALLET_KEY_FILE)) {
    const savedKey = fs.readFileSync(WALLET_KEY_FILE, "utf8").trim();
    if (savedKey.startsWith("0x") && savedKey.length === 66) {
      privateKey = savedKey as `0x${string}`;
    }
  }

  if (!privateKey) {
    privateKey = generatePrivateKey();
    fs.writeFileSync(WALLET_KEY_FILE, privateKey);
  }

  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const walletProvider = new ViemWalletProvider(walletClient);
  const address = (await walletProvider.getAddress()) as `0x${string}`;

  const balanceWei = await publicClient.getBalance({ address });
  const balanceEth = formatEther(balanceWei);

  console.log(`\n==================================================`);
  console.log(`Agent Active | Wallet Address: ${address}`);
  console.log(`Base Sepolia ETH Balance: ${balanceEth} ETH`);
  console.log(`==================================================\n`);

  if (balanceWei === 0n) {
    console.warn(`[WARNING] Balance is 0 ETH. On-chain settlements will fail due to lack of gas.`);
    console.warn(`Fund this wallet using a Base Sepolia Faucet:`);
    console.warn(`1. QuickNode Faucet: https://faucet.quicknode.com/base/sepolia`);
    console.warn(`2. Base Official Faucet: https://www.bwarelabs.com/faucets/base-sepolia\n`);
  }

  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      walletActionProvider(),
      erc20ActionProvider(),
      pythActionProvider(),
      x402ActionProvider(),
    ],
  });

  const tools = await getLangChainTools(agentKit);

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools,
  });

  const response = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Use the x402 scraper tool to fetch data from https://api.example.com/x402-resource",
      },
    ],
  });

  const lastMessage = response.messages[response.messages.length - 1];
  console.log("\nAgent Final Output:\n", lastMessage.content);
}

runAgent();
