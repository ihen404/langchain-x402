import { AgentKit, CdpEvmWalletProvider, wethActionProvider, pythActionProvider, erc20ActionProvider, cdpApiActionProvider } from "@coinbase/agentkit";
import { customPriceActionProvider } from "./customActionProvider";

let cdpSecret = process.env.CDP_API_KEY_SECRET?.trim();
if (cdpSecret) {
  // Strip outer quotes if accidentally pasted with quotes
  if ((cdpSecret.startsWith('"') && cdpSecret.endsWith('"')) || (cdpSecret.startsWith("'") && cdpSecret.endsWith("'"))) {
    cdpSecret = cdpSecret.slice(1, -1);
  }
  // Convert literal \n sequences to real newlines for PEM format
  process.env.CDP_API_KEY_SECRET = cdpSecret.replace(/\\n/g, "\n");
}

async function runAgent() {
  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyName: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    cdpWalletSecret: process.env.CDP_WALLET_SECRET,
  });

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

  console.log("AgentKit initialized successfully!");
}

runAgent().catch((err) => {
  console.error("Agent execution failed:", err);
  process.exit(1);
});
