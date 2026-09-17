// Owner: Apurva — read-only client + event ABI for the indexer. Aditya consumes this in services/indexer.ts.
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { env } from '../env.js';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(env.RPC_URL),
});

/** Must match contracts/src/DonationPlatform.sol events exactly. */
export const PLATFORM_EVENTS_ABI = parseAbi([
  'event OrgCreated(uint256 indexed orgId, address indexed owner, string name, string description)',
  'event OrgUpdated(uint256 indexed orgId, string name, string description)',
  'event Donated(uint256 indexed orgId, address indexed donor, uint256 amount, string message, uint256 timestamp)',
  'event MilestoneRequested(uint256 indexed orgId, uint256 indexed milestoneId, string description, uint256 amount)',
  'event MilestoneApproved(uint256 indexed orgId, uint256 indexed milestoneId)',
  'event MilestoneReleased(uint256 indexed orgId, uint256 indexed milestoneId, uint256 amount, uint256 timestamp)',
]);

export const PLATFORM_READ_ABI = parseAbi([
  'function admin() view returns (address)',
  'function totalDonated() view returns (uint256)',
  'function totalReleased() view returns (uint256)',
  'function getBalance() view returns (uint256)',
  'function getOrgCount() view returns (uint256)',
]);
