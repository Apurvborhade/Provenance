// Owner: Apurva — donate(value) write.
import { parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { DONATION_TRACKER_ABI, DONATION_TRACKER_ADDRESS } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';
import type { TxState } from '../lib/types';

export function useDonate() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /** @param amountEth e.g. "0.01" */
  const donate = (amountEth: string) =>
    writeContract({
      address: DONATION_TRACKER_ADDRESS,
      abi: DONATION_TRACKER_ABI,
      functionName: 'donate',
      value: parseEther(amountEth),
      chainId: TARGET_CHAIN.id,
    });

  const tx: TxState = { hash, isPending, isConfirming, isSuccess, error };
  return { donate, tx, reset };
}
