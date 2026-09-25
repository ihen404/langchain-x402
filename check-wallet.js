const { createPublicClient, http, formatEther, formatUnits } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');
require('dotenv').config();

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });

async function checkWallet() {
  if (!process.env.BASE_AGENT_PRIVATE_KEY) {
    console.error('❌ BASE_AGENT_PRIVATE_KEY is missing from .env!');
    process.exit(1);
  }
  
  const account = privateKeyToAccount(process.env.BASE_AGENT_PRIVATE_KEY);
  console.log('🤖 Agent Mainnet Address:', account.address);

  const ethBalance = await client.getBalance({ address: account.address });
  console.log('⛽ Gas Balance:', formatEther(ethBalance), 'ETH');

  const usdcAbi = [{
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }];

  const usdcBalance = await client.readContract({
    address: process.env.USDC_TOKEN_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: [account.address]
  });

  console.log('💵 USDC Balance:', formatUnits(usdcBalance, 6), 'USDC');
}

checkWallet().catch(err => console.error('❌ Error:', err.message));
