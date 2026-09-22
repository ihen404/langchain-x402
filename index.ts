import { AgentKit, CdpEvmWalletProvider, wethActionProvider, pythActionProvider, erc20ActionProvider, cdpApiActionProvider } from "@coinbase/agentkit";
import { customPriceActionProvider } from "./customActionProvider";

// Disable telemetry if supported by AgentKit
process.env.AGENTKIT_DISABLE_ANALYTICS = "true";
process.env.DISABLE_TELEMETRY = "true";

// Safely ignore optional background analytics failures without masking real wallet/agent errors
process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  if (message.includes("HTTP error! status: 400") || message.toLowerCase().includes("analytic")) {
    console.warn("Ignoring optional AgentKit analytics failure:", message);
    return;
  }
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

let cdpSecret = process.env.CDP_API_KEY_SECRET?.trim();
if (cdpSecret) {
  if ((cdpSecret.startsWith('"') && cdpSecret.endsWith('"')) || (cdpSecret.startsWith("'") && cdpSecret.endsWith("'"))) {
    cdpSecret = cdpSecret.slice(1, -1);
  }
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
