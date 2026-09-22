import { AgentKit, CdpEvmWalletProvider, wethActionProvider, pythActionProvider, erc20ActionProvider, cdpApiActionProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { customPriceActionProvider } from "./customActionProvider";

// Disable background analytics telemetry
process.env.AGENTKIT_DISABLE_ANALYTICS = "true";
process.env.DISABLE_TELEMETRY = "true";

// Safely handle analytics rejections without breaking execution
process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  if (message.includes("HTTP error! status: 400") || message.toLowerCase().includes("analytic")) {
    console.warn("Ignoring optional AgentKit analytics failure:", message);
    return;
  }
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

// Normalize CDP secret key
let cdpSecret = process.env.CDP_API_KEY_SECRET?.trim();
if (cdpSecret) {
  if ((cdpSecret.startsWith('"') && cdpSecret.endsWith('"')) || (cdpSecret.startsWith("'") && cdpSecret.endsWith("'"))) {
    cdpSecret = cdpSecret.slice(1, -1);
  }
  process.env.CDP_API_KEY_SECRET = cdpSecret.replace(/\\n/g, "\n");
}

function isOpenAIQuotaError(error: unknown): boolean {
  const value = error as {
    status?: number;
    code?: string;
    error?: { code?: string; type?: string };
    message?: string;
  };

  return (
    value?.status === 429 &&
    (
      value?.code === "insufficient_quota" ||
      value?.error?.code === "insufficient_quota" ||
      value?.error?.type === "insufficient_quota" ||
      (typeof value?.message === "string" && value.message.toLowerCase().includes("no credits remaining"))
    )
  );
}

async function runAgent() {
  console.log("Initializing CDP EVM Wallet Provider...");
  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyName: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    cdpWalletSecret: process.env.CDP_WALLET_SECRET,
  });

  const address = await walletProvider.getAddress();
  console.log(`Agent Wallet Address: ${address}`);

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

  console.log("Fetching LangChain tools from AgentKit...");
  const tools = await getLangChainTools(agentKit);

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
  });

  const agent = createReactAgent({
    llm,
    tools,
  });

  const prompt = "Check target pricing for asset 'x402-data-feed' using get_custom_price tool, verify wallet balance, and log the execution status.";

  console.log(`Executing Agent prompt: "${prompt}"`);
  const response = await agent.invoke({
    messages: [{ role: "user", content: prompt }],
  });

  const lastMessage = response.messages[response.messages.length - 1];
  console.log("\n--- Agent Execution Output ---");
  console.log(lastMessage.content);
  console.log("-------------------------------\n");
}

runAgent().catch((err) => {
  if (isOpenAIQuotaError(err)) {
    console.error("::error::OpenAI quota exhausted. Check billing and credit balance for OPENAI_API_KEY at platform.openai.com");
    process.exit(1);
  }

  console.error("Agent execution failed:", err);
  process.exit(1);
});
