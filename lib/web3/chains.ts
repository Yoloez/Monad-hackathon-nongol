import { defineChain } from 'viem';

/**
 * Monad Testnet Chain Definition
 * Chain ID: 10143
 * Native Currency: MON (18 decimals)
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.drpc.org', 'https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://monad-testnet.drpc.org', 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

/**
 * Monad Mainnet Chain Definition
 * Chain ID: 143
 */
export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
    },
    public: {
      http: ['https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://monadexplorer.com',
    },
  },
  testnet: false,
});
