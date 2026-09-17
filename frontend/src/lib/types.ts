// SHARED between Apurva and Aditya — announce before changing.
import type { Address, Hex } from 'viem';

export type MilestoneStatus = 'pending' | 'approved' | 'released';

export interface Milestone {
  id: number;
  description: string;
  /** wei */
  amount: bigint;
  status: MilestoneStatus;
  /** unix seconds */
  createdAt: number;
  /** unix seconds, null until released */
  releasedAt: number | null;
}

export type HistoryKind = 'donated' | 'requested' | 'approved' | 'released';

export interface HistoryItem {
  kind: HistoryKind;
  txHash: Hex;
  blockNumber: bigint;
  /** unix seconds; may be undefined for events without a timestamp arg */
  timestamp?: number;
  actor?: Address;
  /** wei */
  amount?: bigint;
  milestoneId?: number;
  description?: string;
}

export interface Stats {
  /** wei */
  totalDonated: bigint;
  /** wei */
  totalReleased: bigint;
  /** wei */
  balance: bigint;
  milestoneCount: number;
}

/** Shape every write hook exposes so UI buttons can render the same 3 states. */
export interface TxState {
  hash?: Hex;
  isPending: boolean;     // waiting for wallet signature
  isConfirming: boolean;  // tx sent, waiting for receipt
  isSuccess: boolean;
  error?: Error | null;
}
