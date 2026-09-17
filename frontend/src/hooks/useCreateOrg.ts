// Owner: Apurva — createOrg / updateOrg writes. Exposes the new orgId after the receipt lands.
import { useMemo } from 'react';
import { decodeEventLog } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { platformContract } from './contract';
import type { TxState } from '../lib/types';

export function useCreateOrg() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const createOrg = (name: string, description: string) =>
    writeContract({ ...platformContract, functionName: 'createOrg', args: [name, description] });

  const updateOrg = (orgId: number, name: string, description: string) =>
    writeContract({ ...platformContract, functionName: 'updateOrg', args: [BigInt(orgId), name, description] });

  /** orgId from the OrgCreated event in the receipt, once mined. */
  const createdOrgId = useMemo(() => {
    if (!receipt.data) return undefined;
    for (const log of receipt.data.logs) {
      try {
        const decoded = decodeEventLog({ abi: platformContract.abi, data: log.data, topics: log.topics });
        if (decoded.eventName === 'OrgCreated') return Number(decoded.args.orgId);
      } catch {
        /* not our event */
      }
    }
    return undefined;
  }, [receipt.data]);

  const tx: TxState = { hash, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, error };
  return { createOrg, updateOrg, createdOrgId, tx, reset };
}
