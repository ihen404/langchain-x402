import { ViemWalletProvider } from "@coinbase/agentkit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

dotenv.config();

const WALLET_KEY_FILE = "wallet_key.txt";

async function runAgent() {
  console.log("Initializing Viem EVM Wallet Provider...");

  let privateKey: `0x${string}` | undefined;

  // 1. Check for private key in environment variables or local file
  if (process.env.EVM_PRIVATE_KEY) {
    privateKey = process.env.EVM_PRIVATE_KEY.trim() as `0x${string}`;
  } else if (fs.existsSync(WALLET_KEY_FILE)) {
    try {
      const savedKey = fs.readFileSync(WALLET_KEY_FILE, "utf8").trim();
      if (savedKey.startsWith("0x") && savedKey.length === 66) {
        privateKey = savedKey as `0x${string}`;
      }
    } catch (e) {
      console.warn("Could not read local wallet_key.txt file.");
    }
  }

  // 2. If no private key exists, generate a fresh local EVM key and persist it
  if (!privateKey) {
    console.log("No saved wallet key found. Generating fresh local EVM key...");
    privateKey = generatePrivateKey();
    fs.writeFileSync(WALLET_KEY_FILE, privateKey);
  }

  try {
    const account = privateKeyToAccount(privateKey);

    // Create viem client bound to Base Sepolia (or your target network)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(walletClient);
    const address = await walletProvider.getAddress();

    console.log(`Wallet initialized successfully! Address: ${address}`);
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

runAgent();
