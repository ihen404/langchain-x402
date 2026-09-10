import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

function logEvent(level, message, metadata = {}) {
  const isJsonLog = process.env.LOG_FORMAT === "json";
  if (isJsonLog) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...metadata }));
  } else {
    const icon = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
    console.log(`${icon} [${level.toUpperCase()}] ${message}`, Object.keys(metadata).length ? metadata : "");
  }
}

// Exponential backoff fetch helper for transient network errors
async function fetchWithRetry(url, options = {}, retries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Pass through 402, 2xx, or standard 4xx client errors directly
      if (response.ok || response.status === 402 || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      throw new Error(`Transient error with status code: ${response.status}`);
    } catch (err) {
      if (attempt === retries) {
        logEvent("error", "Max retries reached for request.", { attempts: attempt + 1, error: err.message });
        throw err;
      }

      const expDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 500);
      const delay = expDelay + jitter;

      logEvent("warn", "Transient network error. Retrying request...", {
        attempt: attempt + 1,
        maxRetries: retries,
        delayMs: delay,
        error: err.message
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

if (!fs.existsSync(".env")) {
  logEvent("error", "Missing .env file in root directory.");
  process.exit(1);
}

const rawKey = process.env.BASE_AGENT_PRIVATE_KEY || "";
const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;

if (!rawKey || formattedKey.length !== 66) {
  logEvent("error", "BASE_AGENT_PRIVATE_KEY must be a valid 32-byte hex string (64 characters + optional 0x).");
  process.exit(1);
}

const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const account = privateKeyToAccount(formattedKey);
const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

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

const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function scrapeUrl(targetUrl) {
  const API_ENDPOINT = "https://x402-scraper-api-production-67a4.up.railway.app/api/scrape";
  const startTime = Date.now();

  try {
    logEvent("info", "Initiating scraper request", { targetUrl });

    const initialRes = await fetchWithRetry(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl })
    });

    if (initialRes.status === 402) {
      const paymentReq = await initialRes.json();
      const recipient = paymentReq.recipient;
      let tokenAddress = paymentReq.asset_address || paymentReq.asset;

      if (!tokenAddress || tokenAddress.toUpperCase() === "USDC") {
        tokenAddress = BASE_USDC_ADDRESS;
      }

      const isUSDC = tokenAddress.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase();
      const parsedAmount = (typeof paymentReq.price_usd === "number" && isUSDC)
        ? parseUnits(paymentReq.price_usd.toString(), 6)
        : BigInt(paymentReq.amount);

      logEvent("info", "402 Payment Required received. Processing settlement", {
        amount: paymentReq.amount,
        recipient,
        asset: tokenAddress
      });

      let txHash;
      try {
        const gasPrice = await publicClient.getGasPrice();
        const priorityFee = await publicClient.estimateMaxPriorityFeePerGas();

        txHash = await walletClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient, parsedAmount],
          maxFeePerGas: (gasPrice * 12n) / 10n,
          maxPriorityFeePerGas: priorityFee
        });
      } catch (txErr) {
        logEvent("error", "On-chain transaction settlement failed", { error: txErr.shortMessage || txErr.message });
        return;
      }

      logEvent("info", "Settlement transaction submitted", { txHash });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paidRes = await fetchWithRetry(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": txHash
        },
        body: JSON.stringify({ url: targetUrl })
      });

      if (!paidRes.ok) {
        throw new Error(`API responded with status ${paidRes.status} after payment.`);
      }

      const result = await paidRes.json();
      logEvent("info", "Scrape completed successfully", {
        status: paidRes.status,
        durationMs: Date.now() - startTime,
        txHash
      });

      return result;
    }

    const result = await initialRes.json();
    logEvent("info", "Scrape completed without payment requirement", { durationMs: Date.now() - startTime });
    return result;

  } catch (err) {
    logEvent("error", "Scrape execution failed", { error: err.message });
  }
}

const targetUrl = process.argv[2] || "https://example.com";
scrapeUrl(targetUrl).then((data) => {
  if (data) console.log(data);
}).catch(console.error);
