// Owner: Apurva — wrong-chain detection.
import { useAccount, useSwitchChain } from 'wagmi';
import { TARGET_CHAIN } from '../config/wagmi';

export function useNetworkGuard() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  return {
    isWrongNetwork,
    isSwitching: isPending,
    switchToTarget: () => switchChain({ chainId: TARGET_CHAIN.id }),
    targetName: TARGET_CHAIN.name,
  };
}
