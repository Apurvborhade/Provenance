// Owner: Apurva — add / approve / release writes (owner only on-chain).
import { parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { DONATION_TRACKER_ABI, DONATION_TRACKER_ADDRESS } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';
import type { TxState } from '../lib/types';

const base = {
  address: DONATION_TRACKER_ADDRESS,
  abi: DONATION_TRACKER_ABI,
  chainId: TARGET_CHAIN.id,
} as const;

export function useMilestoneActions() {
  const { writeContract, data: hash, isPending, error, reset, variables } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addMilestone = (description: string, amountEth: string) =>
    writeContract({ ...base, functionName: 'addMilestone', args: [description, parseEther(amountEth)] });

  const approveMilestone = (id: number) =>
    writeContract({ ...base, functionName: 'approveMilestone', args: [BigInt(id)] });

  const releaseMilestone = (id: number) =>
    writeContract({ ...base, functionName: 'releaseMilestone', args: [BigInt(id)] });

  const tx: TxState = { hash, isPending, isConfirming, isSuccess, error };

  /** Which function the in-flight tx is for, so buttons can show per-row spinners. */
  const activeFn = variables?.functionName as 'addMilestone' | 'approveMilestone' | 'releaseMilestone' | undefined;
  const activeId = activeFn && activeFn !== 'addMilestone' ? Number((variables?.args as [bigint])[0]) : undefined;

  return { addMilestone, approveMilestone, releaseMilestone, tx, reset, activeFn, activeId };
}
