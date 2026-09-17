import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

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

export async function scrapeUrl(targetUrl, options = {}) {
  const privateKey = options.privateKey || process.env.BASE_AGENT_PRIVATE_KEY;
  const rpcUrl = options.rpcUrl || process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const apiEndpoint = options.apiEndpoint || "https://x402-scraper-api-production-67a4.up.railway.app/api/scrape";

  if (!privateKey) {
    throw new Error("Missing BASE_AGENT_PRIVATE_KEY in environment or options.");
  }

  const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey);
  const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

  const initialRes = await fetch(apiEndpoint, {
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

    const gasPrice = await publicClient.getGasPrice();
    const priorityFee = await publicClient.estimateMaxPriorityFeePerGas();

    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient, parsedAmount],
      maxFeePerGas: (gasPrice * 12n) / 10n,
      maxPriorityFeePerGas: priorityFee
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const paidRes = await fetch(apiEndpoint, {
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

    return await paidRes.json();
  }

  return await initialRes.json();
}

export { x402ScraperTool } from "./langchain-tool.js";

import fs from 'fs';
import path from 'path';

app.get('/openapi.json', (req, res) => {
  const spec = fs.readFileSync(path.resolve('./openapi.json'), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(spec);
});

import fs from 'fs';
import path from 'path';

app.get('/openapi.json', (req, res) => {
  const spec = fs.readFileSync(path.resolve('./openapi.json'), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(spec);
});

import fs from 'fs';
import path from 'path';

app.get('/openapi.json', (req, res) => {
  const spec = fs.readFileSync(path.resolve('./openapi.json'), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(spec);
});
