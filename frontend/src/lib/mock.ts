// Owner: Aditya — realistic sample data for building UI without a chain.
import { parseEther } from 'viem';
import type { HistoryItem, Milestone, Stats } from './types';

const now = Math.floor(Date.now() / 1000);

export const MOCK_OWNER = '0xAbCd000000000000000000000000000000001234' as const;

export const mockMilestones: Milestone[] = [
  {
    id: 0,
    description: 'Purchased 50 textbooks for Grade 5',
    amount: parseEther('0.02'),
    status: 'released',
    createdAt: now - 86400 * 3,
    releasedAt: now - 86400 * 2,
  },
  {
    id: 1,
    description: 'School lunch program — week 1',
    amount: parseEther('0.015'),
    status: 'approved',
    createdAt: now - 86400,
    releasedAt: null,
  },
  {
    id: 2,
    description: 'Repair classroom roof',
    amount: parseEther('0.05'),
    status: 'pending',
    createdAt: now - 3600,
    releasedAt: null,
  },
];

export const mockStats: Stats = {
  totalDonated: parseEther('0.1'),
  totalReleased: parseEther('0.02'),
  balance: parseEther('0.08'),
  milestoneCount: mockMilestones.length,
};

export const mockHistory: HistoryItem[] = [
  {
    kind: 'requested',
    txHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
    blockNumber: 1003n,
    milestoneId: 2,
    description: 'Repair classroom roof',
    amount: parseEther('0.05'),
    timestamp: now - 3600,
  },
  {
    kind: 'released',
    txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
    blockNumber: 1002n,
    milestoneId: 0,
    amount: parseEther('0.02'),
    timestamp: now - 86400 * 2,
  },
  {
    kind: 'donated',
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    blockNumber: 1001n,
    actor: '0x9999000000000000000000000000000000009999',
    amount: parseEther('0.1'),
    timestamp: now - 86400 * 4,
  },
];

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
