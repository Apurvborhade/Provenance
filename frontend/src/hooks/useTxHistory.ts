// Owner: Apurva — reconstruct the audit trail from event logs.
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { DONATION_TRACKER_ABI, DONATION_TRACKER_ADDRESS, DONATION_TRACKER_DEPLOY_BLOCK } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';
import { USE_MOCK, mockHistory } from '../lib/mock';
import type { HistoryItem } from '../lib/types';

/** Public RPCs cap eth_getLogs ranges; chunk to stay under the limit. */
const CHUNK = 10_000n;

export function useTxHistory() {
  const client = usePublicClient({ chainId: TARGET_CHAIN.id });

  return useQuery({
    queryKey: ['txHistory', DONATION_TRACKER_ADDRESS],
    enabled: !!client,
    refetchInterval: 15_000,
    queryFn: async (): Promise<HistoryItem[]> => {
      if (USE_MOCK) return mockHistory;
      if (!client) return [];

      const latest = await client.getBlockNumber();
      const items: HistoryItem[] = [];

      for (let from = DONATION_TRACKER_DEPLOY_BLOCK; from <= latest; from += CHUNK) {
        const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n;
        const logs = await client.getContractEvents({
          address: DONATION_TRACKER_ADDRESS,
          abi: DONATION_TRACKER_ABI,
          fromBlock: from,
          toBlock: to,
        });

        for (const log of logs) {
          const common = { txHash: log.transactionHash, blockNumber: log.blockNumber };
          switch (log.eventName) {
            case 'Donated':
              items.push({
                ...common,
                kind: 'donated',
                actor: log.args.donor,
                amount: log.args.amount,
                timestamp: Number(log.args.timestamp),
              });
              break;
            case 'MilestoneRequested':
              items.push({
                ...common,
                kind: 'requested',
                milestoneId: Number(log.args.id),
                description: log.args.description,
                amount: log.args.amount,
              });
              break;
            case 'MilestoneApproved':
              items.push({ ...common, kind: 'approved', milestoneId: Number(log.args.id) });
              break;
            case 'MilestoneReleased':
              items.push({
                ...common,
                kind: 'released',
                milestoneId: Number(log.args.id),
                amount: log.args.amount,
                timestamp: Number(log.args.timestamp),
              });
              break;
          }
        }
      }

      // newest first
      return items.sort((a, b) => (a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1));
    },
  });
}
