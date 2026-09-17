// Owner: Apurva — read-only client + event ABI for the indexer. Aditya consumes this in services/indexer.ts.
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { env } from '../env.js';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(env.RPC_URL),
});

/** Must match contracts/src/DonationTracker.sol events exactly. */
export const TRACKER_EVENTS_ABI = parseAbi([
  'event Donated(address indexed donor, uint256 amount, uint256 timestamp)',
  'event MilestoneRequested(uint256 indexed id, string description, uint256 amount)',
  'event MilestoneApproved(uint256 indexed id)',
  'event MilestoneReleased(uint256 indexed id, uint256 amount, uint256 timestamp)',
]);

export const TRACKER_READ_ABI = parseAbi([
  'function totalDonated() view returns (uint256)',
  'function totalReleased() view returns (uint256)',
  'function getBalance() view returns (uint256)',
  'function getMilestoneCount() view returns (uint256)',
]);
