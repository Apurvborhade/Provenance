// Owner: Apurva — all contract READS in one place.
import { useMemo } from 'react';
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { DONATION_TRACKER_ABI, DONATION_TRACKER_ADDRESS } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';
import { USE_MOCK, MOCK_OWNER, mockMilestones, mockStats } from '../lib/mock';
import type { Milestone, Stats } from '../lib/types';

const contract = {
  address: DONATION_TRACKER_ADDRESS,
  abi: DONATION_TRACKER_ABI,
  chainId: TARGET_CHAIN.id,
} as const;

const REFETCH_MS = 8_000;

type RawMilestone = {
  description: string;
  amount: bigint;
  approved: boolean;
  released: boolean;
  createdAt: bigint;
  releasedAt: bigint;
};

function toMilestone(raw: RawMilestone, id: number): Milestone {
  return {
    id,
    description: raw.description,
    amount: raw.amount,
    status: raw.released ? 'released' : raw.approved ? 'approved' : 'pending',
    createdAt: Number(raw.createdAt),
    releasedAt: raw.releasedAt === 0n ? null : Number(raw.releasedAt),
  };
}

export function useDonationTracker() {
  const { address: connected } = useAccount();
  const queryClient = useQueryClient();

  const owner = useReadContract({ ...contract, functionName: 'owner', query: { enabled: !USE_MOCK } });
  const totalDonated = useReadContract({
    ...contract,
    functionName: 'totalDonated',
    query: { enabled: !USE_MOCK, refetchInterval: REFETCH_MS },
  });
  const totalReleased = useReadContract({
    ...contract,
    functionName: 'totalReleased',
    query: { enabled: !USE_MOCK, refetchInterval: REFETCH_MS },
  });
  const balance = useReadContract({
    ...contract,
    functionName: 'getBalance',
    query: { enabled: !USE_MOCK, refetchInterval: REFETCH_MS },
  });
  const milestonesRaw = useReadContract({
    ...contract,
    functionName: 'getMilestones',
    query: { enabled: !USE_MOCK, refetchInterval: REFETCH_MS },
  });

  const refetchAll = () => {
    // Invalidate every readContract query so all tiles/tables refresh together.
    void queryClient.invalidateQueries({ queryKey: ['readContract'] });
    void queryClient.invalidateQueries({ queryKey: ['txHistory'] });
  };

  // Push-based refresh; polling above is the fallback for RPCs without filter support.
  useWatchContractEvent({ ...contract, eventName: 'Donated', onLogs: refetchAll, enabled: !USE_MOCK });
  useWatchContractEvent({ ...contract, eventName: 'MilestoneRequested', onLogs: refetchAll, enabled: !USE_MOCK });
  useWatchContractEvent({ ...contract, eventName: 'MilestoneApproved', onLogs: refetchAll, enabled: !USE_MOCK });
  useWatchContractEvent({ ...contract, eventName: 'MilestoneReleased', onLogs: refetchAll, enabled: !USE_MOCK });

  const milestones: Milestone[] = useMemo(() => {
    if (USE_MOCK) return mockMilestones;
    return (milestonesRaw.data ?? []).map((m, i) => toMilestone(m as RawMilestone, i));
  }, [milestonesRaw.data]);

  const stats: Stats = USE_MOCK
    ? mockStats
    : {
        totalDonated: totalDonated.data ?? 0n,
        totalReleased: totalReleased.data ?? 0n,
        balance: balance.data ?? 0n,
        milestoneCount: milestones.length,
      };

  const ownerAddress = USE_MOCK ? MOCK_OWNER : owner.data;
  const isOwner = !!connected && !!ownerAddress && connected.toLowerCase() === ownerAddress.toLowerCase();

  const isLoading = !USE_MOCK && (owner.isLoading || milestonesRaw.isLoading || balance.isLoading);
  const error = owner.error ?? milestonesRaw.error ?? balance.error ?? null;

  return { owner: ownerAddress, isOwner, stats, milestones, isLoading, error, refetchAll };
}
