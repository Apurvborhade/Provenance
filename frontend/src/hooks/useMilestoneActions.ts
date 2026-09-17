// Owner: Apurva — add / release / attachProof (org owner), approve (admin).
import { parseEther, type Address, type Hex } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { platformContract } from './contract';
import type { TxState } from '../lib/types';

export function useMilestoneActions(orgId: number) {
  const { writeContract, data: hash, isPending, error, reset, variables } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const oid = BigInt(orgId);

  const addMilestone = (description: string, amountEth: string, payee: Address) =>
    writeContract({ ...platformContract, functionName: 'addMilestone', args: [oid, description, parseEther(amountEth), payee] });

  const approveMilestone = (id: number) =>
    writeContract({ ...platformContract, functionName: 'approveMilestone', args: [oid, BigInt(id)] });

  const releaseMilestone = (id: number) =>
    writeContract({ ...platformContract, functionName: 'releaseMilestone', args: [oid, BigInt(id)] });

  const attachProof = (id: number, hash: Hex, uri: string) =>
    writeContract({ ...platformContract, functionName: 'attachProof', args: [oid, BigInt(id), hash, uri] });

  const tx: TxState = { hash, isPending, isConfirming, isSuccess, error };

  /** Which function the in-flight tx is for, so buttons can show per-row spinners. */
  const activeFn = variables?.functionName as 'addMilestone' | 'approveMilestone' | 'releaseMilestone' | 'attachProof' | undefined;
  const activeId =
    activeFn && activeFn !== 'addMilestone' ? Number((variables?.args as readonly [bigint, bigint])[1]) : undefined;

  return { addMilestone, approveMilestone, releaseMilestone, attachProof, tx, reset, activeFn, activeId };
}
