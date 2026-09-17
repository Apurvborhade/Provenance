// Owner: Apurva — add (org owner) / approve (admin) / release (org owner) writes.
import { parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { platformContract } from './contract';
import type { TxState } from '../lib/types';

export function useMilestoneActions(orgId: number) {
  const { writeContract, data: hash, isPending, error, reset, variables } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const oid = BigInt(orgId);

  const addMilestone = (description: string, amountEth: string) =>
    writeContract({ ...platformContract, functionName: 'addMilestone', args: [oid, description, parseEther(amountEth)] });

  const approveMilestone = (id: number) =>
    writeContract({ ...platformContract, functionName: 'approveMilestone', args: [oid, BigInt(id)] });

  const releaseMilestone = (id: number) =>
    writeContract({ ...platformContract, functionName: 'releaseMilestone', args: [oid, BigInt(id)] });

  const tx: TxState = { hash, isPending, isConfirming, isSuccess, error };

  /** Which function the in-flight tx is for, so buttons can show per-row spinners. */
  const activeFn = variables?.functionName as 'addMilestone' | 'approveMilestone' | 'releaseMilestone' | undefined;
  const activeId =
    activeFn && activeFn !== 'addMilestone' ? Number((variables?.args as readonly [bigint, bigint])[1]) : undefined;

  return { addMilestone, approveMilestone, releaseMilestone, tx, reset, activeFn, activeId };
}
