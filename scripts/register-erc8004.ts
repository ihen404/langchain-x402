import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const WALLET_KEY_FILE = "wallet_key.txt";
const ERC8004_BASE_SEPOLIA_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const MANIFEST_URL = "https://raw.githubusercontent.com/ihen404/langchain-x402/main/mcp.json";

// Minimal ABI for ERC-8004 IdentityRegistry register function
const ERC8004_IDENTITY_ABI = [
  {
    inputs: [{ internalType: "string", name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function registerOnERC8004() {
  let privateKey: `0x${string}` | undefined;

  if (process.env.EVM_PRIVATE_KEY) {
    privateKey = process.env.EVM_PRIVATE_KEY.trim() as `0x${string}`;
  } else if (fs.existsSync(WALLET_KEY_FILE)) {
    const savedKey = fs.readFileSync(WALLET_KEY_FILE, "utf8").trim() as `0x${string}`;
    if (savedKey.startsWith("0x") && savedKey.length === 66) {
      privateKey = savedKey;
    }
  }

  if (!privateKey) {
    console.error("Error: No private key found in EVM_PRIVATE_KEY or wallet_key.txt.");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });

  console.log(`\n==================================================`);
  console.log(`ERC-8004 Identity Registration`);
  console.log(`Registrant Address: ${account.address}`);
  console.log(`Target Contract: ${ERC8004_BASE_SEPOLIA_IDENTITY_REGISTRY}`);
  console.log(`Manifest URI: ${MANIFEST_URL}`);
  console.log(`ETH Balance: ${balance.toString()} wei`);
  console.log(`==================================================\n`);

  if (balance === 0n) {
    console.error("Registration halted: Wallet requires Base Sepolia testnet ETH to pay gas fees.");
    console.error("Please fund the address above using a Base Sepolia faucet before running this script.");
    process.exit(1);
  }

  console.log("Submitting transaction to mint ERC-8004 Agent ID...");
  const txHash = await walletClient.writeContract({
    address: ERC8004_BASE_SEPOLIA_IDENTITY_REGISTRY,
    abi: ERC8004_IDENTITY_ABI,
    functionName: "register",
    args: [MANIFEST_URL],
  });

  console.log(`Transaction sent! Tx Hash: ${txHash}`);
  console.log("Waiting for transaction receipt...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Successfully registered ERC-8004 Agent Identity on Base Sepolia!`);
  console.log(`Block Number: ${receipt.blockNumber}`);
}

registerOnERC8004();
