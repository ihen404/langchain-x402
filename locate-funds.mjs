import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, base, baseSepolia } from 'viem/chains';
import 'dotenv/config';

const account = privateKeyToAccount(process.env.BASE_AGENT_PRIVATE_KEY);
console.log('🔍 Checking networks for:', account.address);

const usdcAbi = [{
  inputs: [{ name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
}];

async function checkNet(name, chain, rpc, usdcAddr) {
  try {
    const client = createPublicClient({ chain, transport: http(rpc) });
    const eth = await client.getBalance({ address: account.address });
    const usdc = await client.readContract({
      address: usdcAddr,
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`\n🌐 ${name}:`);
    console.log(`   ⛽ ETH: ${formatEther(eth)}`);
    console.log(`   💵 USDC: ${formatUnits(usdc, 6)}`);
  } catch (e) {
    console.log(`\n🌐 ${name}: Error checking (${e.message})`);
  }
}

async function main() {
  await checkNet('Base Mainnet (L2)', base, process.env.RPC_URL, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  await checkNet('Base Sepolia (Testnet)', baseSepolia, 'https://sepolia.base.org', '0x036CbD53842c5426634e7929541eC2318f3dCF7e');
  await checkNet('Ethereum Mainnet (L1)', mainnet, 'https://eth-mainnet.g.alchemy.com/v2/alch_JOXflPtewx8UPcpi65whh', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
}

main();
