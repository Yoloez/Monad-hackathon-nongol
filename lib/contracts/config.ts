import type { Address } from "viem";

/**
 * Smart contract and network configuration loaded from environment variables.
 */
export const NONGOL_CONTRACT_CONFIG = {
  address: (process.env.NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS || "") as Address,
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 10143),
  rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
  explorerUrl:
    process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || "https://testnet.monadexplorer.com",
  platformAddress: (process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ||
    "") as Address,
} as const;

/**
 * Returns true if a valid deployed contract address is configured in environment.
 */
export function isContractConfigured(): boolean {
  return Boolean(
    NONGOL_CONTRACT_CONFIG.address &&
      NONGOL_CONTRACT_CONFIG.address.startsWith("0x") &&
      NONGOL_CONTRACT_CONFIG.address.length === 42,
  );
}
