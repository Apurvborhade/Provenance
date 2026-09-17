// Owner: Apurva — reconstruct the audit trail from event logs, optionally filtered to one org.
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { DONATION_PLATFORM_ABI, DONATION_PLATFORM_ADDRESS, DONATION_PLATFORM_DEPLOY_BLOCK } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';
import { USE_MOCK, mockHistory } from '../lib/mock';
import type { HistoryItem } from '../lib/types';

/** Public RPCs cap eth_getLogs ranges; chunk to stay under the limit. */
const CHUNK = 10_000n;

export function useTxHistory(orgId?: number) {
  const client = usePublicClient({ chainId: TARGET_CHAIN.id });

  return useQuery({
    queryKey: ['txHistory', DONATION_PLATFORM_ADDRESS, orgId ?? 'all'],
    enabled: !!client,
    refetchInterval: 15_000,
    queryFn: async (): Promise<HistoryItem[]> => {
      if (USE_MOCK) return orgId === undefined ? mockHistory : mockHistory.filter((h) => h.orgId === orgId);
      if (!client) return [];

      const latest = await client.getBlockNumber();
      const items: HistoryItem[] = [];

      for (let from = DONATION_PLATFORM_DEPLOY_BLOCK; from <= latest; from += CHUNK) {
        const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n;
        const logs = await client.getContractEvents({
          address: DONATION_PLATFORM_ADDRESS,
          abi: DONATION_PLATFORM_ABI,
          fromBlock: from,
          toBlock: to,
        });

        for (const log of logs) {
          if (log.eventName === 'OrgUpdated') continue;
          const oid = Number(log.args.orgId);
          if (orgId !== undefined && oid !== orgId) continue;
          const common = { txHash: log.transactionHash, blockNumber: log.blockNumber, orgId: oid };

          switch (log.eventName) {
            case 'OrgCreated':
              items.push({ ...common, kind: 'orgCreated', actor: log.args.owner, name: log.args.name });
              break;
            case 'Donated':
              items.push({
                ...common,
                kind: 'donated',
                actor: log.args.donor,
                amount: log.args.amount,
                message: log.args.message,
                timestamp: Number(log.args.timestamp),
              });
              break;
            case 'MilestoneRequested':
              items.push({
                ...common,
                kind: 'requested',
                milestoneId: Number(log.args.milestoneId),
                description: log.args.description,
                amount: log.args.amount,
                payee: log.args.payee,
              });
              break;
            case 'MilestoneApproved':
              items.push({ ...common, kind: 'approved', milestoneId: Number(log.args.milestoneId) });
              break;
            case 'MilestoneReleased':
              items.push({
                ...common,
                kind: 'released',
                milestoneId: Number(log.args.milestoneId),
                amount: log.args.amount,
                payee: log.args.payee,
                timestamp: Number(log.args.timestamp),
              });
              break;
            case 'ProofAttached':
              items.push({
                ...common,
                kind: 'proofAttached',
                milestoneId: Number(log.args.milestoneId),
                proofUri: log.args.proofUri,
                timestamp: Number(log.args.timestamp),
              });
              break;
          }
        }
      }

      return items.sort((a, b) => (a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1));
    },
  });
}
