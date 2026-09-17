// Owner: Apurva — reads for a single org: profile, milestones, role flags.
import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { platformContract, REFETCH_MS } from './contract';
import { toOrg } from './usePlatform';
import { usePlatform } from './usePlatform';
import { USE_MOCK, mockMilestones, mockOrgs } from '../lib/mock';
import type { Milestone, Org } from '../lib/types';

type RawMilestone = {
  description: string;
  amount: bigint;
  payee: `0x${string}`;
  approved: boolean;
  released: boolean;
  createdAt: bigint;
  releasedAt: bigint;
  proofHash: `0x${string}`;
  proofUri: string;
  proofAt: bigint;
};

function toMilestone(raw: RawMilestone, orgId: number, id: number): Milestone {
  return {
    id,
    orgId,
    description: raw.description,
    amount: raw.amount,
    payee: raw.payee,
    status: raw.released ? 'released' : raw.approved ? 'approved' : 'pending',
    createdAt: Number(raw.createdAt),
    releasedAt: raw.releasedAt === 0n ? null : Number(raw.releasedAt),
    proof: raw.proofAt === 0n ? null : { hash: raw.proofHash, uri: raw.proofUri, at: Number(raw.proofAt) },
  };
}

export function useOrg(orgId: number) {
  const { address: connected } = useAccount();
  const { isAdmin, admin } = usePlatform();
  const args = [BigInt(orgId)] as const;
  const q = { enabled: !USE_MOCK, refetchInterval: REFETCH_MS };

  const orgRaw = useReadContract({ ...platformContract, functionName: 'getOrg', args, query: q });
  const milestonesRaw = useReadContract({ ...platformContract, functionName: 'getMilestones', args, query: q });

  const org: Org | undefined = useMemo(() => {
    if (USE_MOCK) return mockOrgs.find((o) => o.id === orgId);
    return orgRaw.data ? toOrg(orgRaw.data, orgId) : undefined;
  }, [orgRaw.data, orgId]);

  const milestones: Milestone[] = useMemo(() => {
    if (USE_MOCK) return mockMilestones[orgId] ?? [];
    return (milestonesRaw.data ?? []).map((m, i) => toMilestone(m as RawMilestone, orgId, i));
  }, [milestonesRaw.data, orgId]);

  const isOrgOwner = !!connected && !!org && connected.toLowerCase() === org.owner.toLowerCase();
  /** Released milestones still awaiting proof — blocks new requests on-chain. */
  const unproofed = milestones.filter((m) => m.status === 'released' && !m.proof);

  return {
    org,
    milestones,
    isOrgOwner,
    isAdmin,
    admin,
    unproofed,
    isLoading: !USE_MOCK && (orgRaw.isLoading || milestonesRaw.isLoading),
    notFound: !USE_MOCK && !!orgRaw.error && /InvalidOrg/.test(orgRaw.error.message),
    error: orgRaw.error ?? milestonesRaw.error ?? null,
  };
}
