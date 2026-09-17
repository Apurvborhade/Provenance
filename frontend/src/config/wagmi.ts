// Owner: Apurva
import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org';

export const TARGET_CHAIN = baseSepolia;

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
