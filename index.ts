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

  // Fallback to local cdp_api_key.json file
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

  const networkId = process.env.NETWORK_ID || "base-sepolia";

  try {
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
    });

    const address = await walletProvider.getAddress();
    console.log(`Wallet initialized successfully. Address: ${address}`);
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

runAgent();
