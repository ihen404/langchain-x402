import dotenv from "dotenv";
dotenv.config();

import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// 1. Dynamic Network Selection
const isSepolia = (process.env.NETWORK || "").toLowerCase() === "sepolia" || process.env.TARGET_URL?.includes("localhost");
const chain = isSepolia ? baseSepolia : base;
const defaultRpc = isSepolia ? "https://sepolia.base.org" : "https://mainnet.base.org";
const rpcUrl = process.env.RPC_URL || defaultRpc;

// 2. Target URL Configuration
const targetUrl = process.env.TARGET_URL || "https://x402-scraper-api-production-67a4.up.railway.app/api/scrape";

console.log(`🌐 Environment: ${chain.name} (Chain ID: ${chain.id})`);
console.log(`🔗 Target URL: ${targetUrl}`);

const rawKey = process.env.BASE_AGENT_PRIVATE_KEY || "";
if (!rawKey) {
console.error("❌ BASE_AGENT_PRIVATE_KEY missing from environment.");
process.exit(1);
}

const key = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
const account = privateKeyToAccount(key);

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

async function executeScrape() {
console.log("ℹ️ [INFO] Initiating scraper request", { targetUrl });

try {
let res = await fetch(targetUrl);

if (res.status === 402) {
  const paymentDetails = await res.json();
  console.log("ℹ️ [INFO] 402 Payment Required received. Processing settlement", paymentDetails);

  const { amount, recipient, asset } = paymentDetails;

  const erc20Abi = [
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" }
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable"
    }
  ];

  console.log("⏳ Submitting payment transaction on-chain...");
  const hash = await walletClient.writeContract({
    address: asset,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, BigInt(amount)]
  });

  console.log("⏳ Waiting for transaction confirmation:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Settlement confirmed on-chain!");

  // Retry request with settlement hash in header
  res = await fetch(targetUrl, {
    headers: {
      "X-PAYMENT": hash
    }
  });
}

const data = await res.json();
console.log("🎉 Scrape execution succeeded!", data);
} catch (err) {
console.error("❌ Scrape execution failed", { error: err.message });
}
}

executeScrape();
