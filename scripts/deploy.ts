import fs from 'fs';
import path from 'path';
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../lib/web3/chains';
import { NONGOL_EVENT_ABI } from '../lib/contracts/nongolEventAbi';

// Load .env if present
try {
  // @ts-ignore
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  } else {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const [k, ...v] = line.split('=');
        if (k && v) process.env[k.trim()] = v.join('=').trim();
      });
    }
  }
} catch {
  // ignore
}

/**
 * Script to deploy NongolEvent contract to Monad Testnet.
 * Run with: npx tsx scripts/deploy.ts
 */
async function main() {
  let privateKey = process.env.DEPLOYER_PRIVATE_KEY as string;
  if (!privateKey) {
    console.error('Please set DEPLOYER_PRIVATE_KEY in your environment (.env)');
    process.exit(1);
  }

  if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`\n========================================`);
  console.log(`Deployer address: ${account.address}`);

  const rpcUrl = process.env.MONAD_RPC_URL || 'https://rpc.ankr.com/monad_testnet';

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${Number(balance) / 1e18} MON`);

  if (balance === 0n) {
    console.warn('\n⚠️ WARNING: Saldo MON deployer adalah 0. Klaim faucet terlebih dahulu di https://testnet.monad.xyz');
  }

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const now = Math.floor(Date.now() / 1000);

  // Configuration for single MVP event
  const organizer = (process.env.ORGANIZER_ADDRESS || account.address) as Address;
  const platform = (process.env.PLATFORM_ADDRESS || account.address) as Address;

  // Timeline:
  // Registration open for 7 days
  const registrationDeadline = BigInt(now + 7 * 24 * 3600);
  // Event starts on day 8
  const checkInStartTime = BigInt(now + 8 * 24 * 3600);
  // Check-in closes 4 hours after start
  const checkInDeadline = BigInt(now + 8 * 24 * 3600 + 4 * 3600);

  console.log('--- NongolEvent Deployment Config ---');
  console.log(`Organizer: ${organizer}`);
  console.log(`Platform: ${platform}`);
  console.log(`Registration Deadline: ${new Date(Number(registrationDeadline) * 1000).toLocaleString()}`);
  console.log(`Check-in Start: ${new Date(Number(checkInStartTime) * 1000).toLocaleString()}`);
  console.log(`Check-in Deadline: ${new Date(Number(checkInDeadline) * 1000).toLocaleString()}`);

  const artifactPath = path.resolve(__dirname, '../build/NongolEvent.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Artifact not found. Please run npx tsx scripts/compile.ts first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  console.log('\nDeploying NongolEvent to Monad Testnet (Chain ID 10143)...');

  const hash = await walletClient.deployContract({
    abi: NONGOL_EVENT_ABI,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [
      organizer,
      platform,
      registrationDeadline,
      checkInStartTime,
      checkInDeadline,
    ],
    maxFeePerGas: 150_000_000_000n, // 150 gwei (Monad min base fee: 100 gwei)
    maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
  });

  console.log(`Transaction sent! Tx Hash: ${hash}`);
  console.log(`Explorer: https://testnet.monadexplorer.com/tx/${hash}`);
  console.log('Waiting for block confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\n🎉 SUCCESS! Contract successfully deployed on Monad Testnet!`);
  console.log(`Contract Address: ${receipt.contractAddress}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`\nUpdate your .env file with:`);
  console.log(`NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

if (require.main === module) {
  main().catch(console.error);
}
