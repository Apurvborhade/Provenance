// SHARED between Apurva and Aditya — announce before changing.
import type { Address, Hex } from 'viem';

export interface Org {
  id: number;
  owner: Address;
  name: string;
  description: string;
  /** wei */
  totalDonated: bigint;
  /** wei */
  totalReleased: bigint;
  /** wei, currently escrowed for this org */
  balance: bigint;
  donorCount: number;
  /** unix seconds */
  createdAt: number;
  /** milestones released */
  releasedCount: number;
  /** released milestones with proof attached */
  proofCount: number;
}

export type MilestoneStatus = 'pending' | 'approved' | 'released';

export interface Milestone {
  id: number;
  orgId: number;
  description: string;
  /** wei */
  amount: bigint;
  /** receives the funds on release */
  payee: Address;
  status: MilestoneStatus;
  /** unix seconds */
  createdAt: number;
  /** unix seconds, null until released */
  releasedAt: number | null;
  /** proof-of-spend; null until attached */
  proof: { hash: Hex; uri: string; at: number } | null;
}

export type HistoryKind = 'orgCreated' | 'donated' | 'requested' | 'approved' | 'released' | 'proofAttached';

export interface HistoryItem {
  kind: HistoryKind;
  txHash: Hex;
  blockNumber: bigint;
  orgId: number;
  /** unix seconds; undefined for events without a timestamp arg */
  timestamp?: number;
  actor?: Address;
  /** wei */
  amount?: bigint;
  milestoneId?: number;
  description?: string;
  /** donor memo */
  message?: string;
  /** org name for OrgCreated */
  name?: string;
  /** payee for requested/released */
  payee?: Address;
  /** proof uri for proofAttached */
  proofUri?: string;
}

export interface PlatformStats {
  totalDonated: bigint;
  totalReleased: bigint;
  balance: bigint;
  orgCount: number;
}

/** Shape every write hook exposes so UI buttons can render the same 3 states. */
export interface TxState {
  hash?: Hex;
  isPending: boolean;     // waiting for wallet signature
  isConfirming: boolean;  // tx sent, waiting for receipt
  isSuccess: boolean;
  error?: Error | null;
}
