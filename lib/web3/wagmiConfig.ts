import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { monadTestnet, monadMainnet } from './chains';

/**
 * Wagmi configuration targeted for Monad.
 * - Default chain: Monad Testnet (Chain ID 10143)
 * - Supported wallet: MetaMask (injected)
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet, monadMainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
    [monadMainnet.id]: http('https://rpc.monad.xyz'),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
