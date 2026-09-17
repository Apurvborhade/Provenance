// Owner: Aditya (loop + upserts). Apurva owns lib/viem.ts (client + event ABI).
import { prisma } from '../lib/prisma.js';
import { publicClient, PLATFORM_EVENTS_ABI } from '../lib/viem.js';
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, env } from '../env.js';

/** Public RPCs reject large eth_getLogs ranges. */
const CHUNK = 10_000;

let running = false;
let timer: NodeJS.Timeout | null = null;

async function getCursor(): Promise<number> {
  const state = await prisma.indexerState.findUnique({ where: { id: 1 } });
  return state ? state.lastBlock + 1 : env.CONTRACT_DEPLOY_BLOCK;
}

async function setCursor(block: number) {
  await prisma.indexerState.upsert({ where: { id: 1 }, create: { id: 1, lastBlock: block }, update: { lastBlock: block } });
}

async function indexRange(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getContractEvents({
    address: CONTRACT_ADDRESS,
    abi: PLATFORM_EVENTS_ABI,
    fromBlock,
    toBlock,
  });

  // Block timestamps for events that don't carry one.
  const blockTs = new Map<bigint, number>();
  const tsFor = async (bn: bigint) => {
    if (!blockTs.has(bn)) {
      const b = await publicClient.getBlock({ blockNumber: bn });
      blockTs.set(bn, Number(b.timestamp));
    }
    return blockTs.get(bn)!;
  };

  for (const log of logs) {
    const txHash = log.transactionHash;
    const blockNumber = Number(log.blockNumber);
    const orgId = Number(log.args.orgId);

    switch (log.eventName) {
      case 'OrgCreated':
        await prisma.org.upsert({
          where: { id: orgId },
          create: {
            id: orgId,
            owner: log.args.owner!,
            name: log.args.name!,
            description: log.args.description ?? '',
            createdAt: await tsFor(log.blockNumber),
            createTxHash: txHash,
          },
          update: {},
        });
        break;

      case 'OrgUpdated':
        await prisma.org.updateMany({
          where: { id: orgId },
          data: { name: log.args.name!, description: log.args.description ?? '' },
        });
        break;

      case 'Donated':
        await prisma.donation.upsert({
          where: { txHash },
          create: {
            txHash,
            logIndex: log.logIndex,
            orgId,
            donor: log.args.donor!,
            amount: log.args.amount!.toString(),
            message: log.args.message ?? '',
            blockNumber,
            timestamp: Number(log.args.timestamp),
          },
          update: {},
        });
        break;

      case 'MilestoneRequested': {
        const id = Number(log.args.milestoneId);
        await prisma.milestone.upsert({
          where: { orgId_id: { orgId, id } },
          create: {
            orgId,
            id,
            description: log.args.description!,
            amount: log.args.amount!.toString(),
            status: 'pending',
            createdAt: await tsFor(log.blockNumber),
            requestTxHash: txHash,
          },
          update: {},
        });
        break;
      }

      case 'MilestoneApproved':
        await prisma.milestone.updateMany({
          where: { orgId, id: Number(log.args.milestoneId), status: 'pending' },
          data: { status: 'approved', approveTxHash: txHash },
        });
        break;

      case 'MilestoneReleased':
        await prisma.milestone.updateMany({
          where: { orgId, id: Number(log.args.milestoneId) },
          data: { status: 'released', releaseTxHash: txHash, releasedAt: Number(log.args.timestamp) },
        });
        break;
    }
  }

  return logs.length;
}

export async function indexOnce(): Promise<{ from: number; to: number; events: number } | null> {
  if (running) return null;
  running = true;
  try {
    const latest = Number(await publicClient.getBlockNumber());
    const from = await getCursor();
    if (from > latest) return { from, to: latest, events: 0 };

    let events = 0;
    for (let start = from; start <= latest; start += CHUNK) {
      const end = Math.min(start + CHUNK - 1, latest);
      events += await indexRange(BigInt(start), BigInt(end));
      await setCursor(end);
    }
    return { from, to: latest, events };
  } finally {
    running = false;
  }
}

export function startIndexer() {
  if (!env.INDEXER_ENABLED) return console.log('[indexer] disabled via INDEXER_ENABLED=false');
  if (!CONTRACT_CONFIGURED) return console.log('[indexer] CONTRACT_ADDRESS not set — skipping. Serving seed/static data only.');

  const tick = async () => {
    try {
      const r = await indexOnce();
      if (r && r.events > 0) console.log(`[indexer] blocks ${r.from}→${r.to}: ${r.events} events`);
    } catch (err) {
      console.error('[indexer] error:', (err as Error).message);
    } finally {
      timer = setTimeout(tick, env.INDEXER_POLL_MS);
    }
  };
  void tick();
  console.log(`[indexer] started, polling every ${env.INDEXER_POLL_MS}ms from block ${env.CONTRACT_DEPLOY_BLOCK}`);
}

export function stopIndexer() {
  if (timer) clearTimeout(timer);
}
