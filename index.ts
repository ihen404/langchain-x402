import { CdpWalletProvider } from "@coinbase/agentkit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const WALLET_DATA_FILE = "wallet_data.txt";

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
    } catch (e) {
      console.warn("Could not parse local cdp_api_key.json file.");
    }
  }

  // Sanitize key secret newline escapes
  if (apiKeyPrivateKey) {
    apiKeyPrivateKey = apiKeyPrivateKey.replace(/\\n/g, "\n");
  }

  if (!apiKeyName || !apiKeyPrivateKey) {
    throw new Error("Missing CDP API credentials. Check process.env or cdp_api_key.json.");
  }

  // Check for saved wallet data locally or in process.env
  let cdpWalletData: string | undefined = process.env.CDP_WALLET_DATA?.trim();

  if (!cdpWalletData && fs.existsSync(WALLET_DATA_FILE)) {
    try {
      cdpWalletData = fs.readFileSync(WALLET_DATA_FILE, "utf8").trim();
    } catch (e) {
      console.warn("Could not read local wallet_data.txt file.");
    }
  }

  const networkId = process.env.NETWORK_ID || "base-sepolia";

  try {
    // Pass cdpWalletData if present; otherwise configure options explicitly
    const configOptions: any = {
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
    };

    if (cdpWalletData && cdpWalletData.length > 0) {
      configOptions.cdpWalletData = cdpWalletData;
    }

    const walletProvider = await CdpWalletProvider.configureWithWallet(configOptions);

    // Export and save wallet data locally for future runs
    const exportedData = await walletProvider.exportWallet();
    if (exportedData) {
      const walletDataStr = typeof exportedData === "string" 
        ? exportedData 
        : JSON.stringify(exportedData);
      fs.writeFileSync(WALLET_DATA_FILE, walletDataStr);
    }

    const address = await walletProvider.getAddress();
    console.log(`Wallet initialized successfully! Address: ${address}`);
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

runAgent();
