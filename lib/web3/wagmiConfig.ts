import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet } from "./chains";

/**
 * Wagmi configuration targeted for Monad.
 * - Default chain: Monad Testnet (Chain ID 10143)
 * - Browser wallets, including EIP-6963 wallet discovery.
 * - No contract actions are configured by this wallet foundation.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
