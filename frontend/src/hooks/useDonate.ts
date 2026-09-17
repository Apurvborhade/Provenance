// Owner: Apurva — donate(orgId, message) write.
import { parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { platformContract } from './contract';
import type { TxState } from '../lib/types';

export function useDonate(orgId: number) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /** @param amountEth e.g. "0.01" */
  const donate = (amountEth: string, message = '') =>
    writeContract({
      ...platformContract,
      functionName: 'donate',
      args: [BigInt(orgId), message],
      value: parseEther(amountEth),
    });

  const tx: TxState = { hash, isPending, isConfirming, isSuccess, error };
  return { donate, tx, reset };
}
