// Owner: Apurva — platform-wide reads: admin, org list, totals. Plus event watchers that refresh everything.
import { useMemo } from 'react';
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { platformContract, REFETCH_MS } from './contract';
import { USE_MOCK, MOCK_ADMIN, mockOrgs, mockPlatformStats } from '../lib/mock';
import type { Org, PlatformStats } from '../lib/types';

type RawOrg = {
  owner: `0x${string}`;
  name: string;
  description: string;
  totalDonated: bigint;
  totalReleased: bigint;
  balance: bigint;
  donorCount: bigint;
  createdAt: bigint;
};

export function toOrg(raw: RawOrg, id: number): Org {
  return {
    id,
    owner: raw.owner,
    name: raw.name,
    description: raw.description,
    totalDonated: raw.totalDonated,
    totalReleased: raw.totalReleased,
    balance: raw.balance,
    donorCount: Number(raw.donorCount),
    createdAt: Number(raw.createdAt),
  };
}

const q = { enabled: !USE_MOCK, refetchInterval: REFETCH_MS };

export function usePlatform() {
  const { address: connected } = useAccount();
  const queryClient = useQueryClient();

  const admin = useReadContract({ ...platformContract, functionName: 'admin', query: { enabled: !USE_MOCK } });
  const orgsRaw = useReadContract({ ...platformContract, functionName: 'getOrgs', query: q });
  const totalDonated = useReadContract({ ...platformContract, functionName: 'totalDonated', query: q });
  const totalReleased = useReadContract({ ...platformContract, functionName: 'totalReleased', query: q });
  const balance = useReadContract({ ...platformContract, functionName: 'getBalance', query: q });

  const refetchAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['readContract'] });
    void queryClient.invalidateQueries({ queryKey: ['txHistory'] });
  };

  // Push-based refresh; polling is the fallback for RPCs without filter support.
  const watch = { ...platformContract, onLogs: refetchAll, enabled: !USE_MOCK } as const;
  useWatchContractEvent({ ...watch, eventName: 'OrgCreated' });
  useWatchContractEvent({ ...watch, eventName: 'Donated' });
  useWatchContractEvent({ ...watch, eventName: 'MilestoneRequested' });
  useWatchContractEvent({ ...watch, eventName: 'MilestoneApproved' });
  useWatchContractEvent({ ...watch, eventName: 'MilestoneReleased' });

  const orgs: Org[] = useMemo(() => {
    if (USE_MOCK) return mockOrgs;
    return (orgsRaw.data ?? []).map((o, i) => toOrg(o as RawOrg, i));
  }, [orgsRaw.data]);

  const stats: PlatformStats = USE_MOCK
    ? mockPlatformStats
    : {
        totalDonated: totalDonated.data ?? 0n,
        totalReleased: totalReleased.data ?? 0n,
        balance: balance.data ?? 0n,
        orgCount: orgs.length,
      };

  const adminAddress = USE_MOCK ? MOCK_ADMIN : admin.data;
  const isAdmin = !!connected && !!adminAddress && connected.toLowerCase() === adminAddress.toLowerCase();

  return {
    admin: adminAddress,
    isAdmin,
    orgs,
    stats,
    isLoading: !USE_MOCK && (orgsRaw.isLoading || admin.isLoading),
    error: orgsRaw.error ?? admin.error ?? null,
    refetchAll,
  };
}
