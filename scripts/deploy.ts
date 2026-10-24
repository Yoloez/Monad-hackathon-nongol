import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../lib/web3/chains';
import { NONGOL_EVENT_ABI } from '../lib/contracts/nongolEventAbi';

/**
 * Script to deploy NongolEvent contract to Monad Testnet.
 * Run with: npx tsx scripts/deploy.ts
 */
async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    console.error('Please set DEPLOYER_PRIVATE_KEY in your environment (.env.local)');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`Deployer address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  const now = Math.floor(Date.now() / 1000);

  // Configuration for single MVP event
  const organizer = (process.env.ORGANIZER_ADDRESS || account.address) as `0x${string}`;
  const platform = (process.env.PLATFORM_ADDRESS || account.address) as `0x${string}`;
  
  // Example timeline:
  // Registration open for 3 days
  const registrationDeadline = BigInt(now + 3 * 24 * 3600);
  // Event starts on day 4
  const checkInStartTime = BigInt(now + 4 * 24 * 3600);
  // Check-in closes 2 hours after start
  const checkInDeadline = BigInt(now + 4 * 24 * 3600 + 2 * 3600);

  console.log('--- NongolEvent Deployment Config ---');
  console.log(`Organizer: ${organizer}`);
  console.log(`Platform: ${platform}`);
  console.log(`Registration Deadline: ${new Date(Number(registrationDeadline) * 1000).toISOString()}`);
  console.log(`Check-in Start: ${new Date(Number(checkInStartTime) * 1000).toISOString()}`);
  console.log(`Check-in Deadline: ${new Date(Number(checkInDeadline) * 1000).toISOString()}`);

  console.log('\nDeploying to Monad Testnet (Chain ID 10143)...');

  // Bytecode should be inserted when compiled with solc/foundry
  console.log('Ready for deployment once bytecode is compiled.');
}

if (require.main === module) {
  main().catch(console.error);
}
