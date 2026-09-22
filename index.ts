import { CdpWalletProvider } from "@coinbase/agentkit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function runAgent() {
  console.log("Initializing CDP EVM Wallet Provider...");

  let apiKeyName = process.env.CDP_API_KEY_ID;
  let apiKeyPrivateKey = process.env.CDP_API_KEY_SECRET 
    ? process.env.CDP_API_KEY_SECRET.replace(/\\n/g, "\n") 
    : undefined;

  // Fallback to local cdp_api_key.json file if available
  const keyFilePath = path.resolve(process.cwd(), "cdp_api_key.json");
  if (fs.existsSync(keyFilePath)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
      apiKeyName = keyData.name || keyData.apiKeyName || apiKeyName;
      apiKeyPrivateKey = keyData.privateKey || keyData.apiKeySecret || apiKeyPrivateKey;
      if (apiKeyPrivateKey) {
        apiKeyPrivateKey = apiKeyPrivateKey.replace(/\\n/g, "\n");
      }
    } catch (e) {
      console.warn("Could not parse local cdp_api_key.json file.");
    }
  }

  // Only pass wallet data if it's non-empty
  const rawWalletData = process.env.CDP_WALLET_SECRET?.trim();
  const cdpWalletData = rawWalletData && rawWalletData.length > 0 ? rawWalletData : undefined;

  // Build options dynamically without forcing an invalid networkId string
  const configOptions: Record<string, any> = {
    apiKeyName,
    apiKeyPrivateKey,
    cdpWalletData,
  };

  if (process.env.NETWORK_ID) {
    configOptions.networkId = process.env.NETWORK_ID;
  }

  try {
    const walletProvider = await CdpWalletProvider.configureWithWallet(configOptions);

    const address = await walletProvider.getAddress();
    console.log(`Wallet initialized successfully. Address: ${address}`);
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

runAgent();
