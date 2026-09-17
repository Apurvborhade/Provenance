// Owner: Aditya — realistic sample data for building UI without a chain.
import { parseEther } from 'viem';
import type { HistoryItem, Milestone, Org, PlatformStats } from './types';

const now = Math.floor(Date.now() / 1000);

export const MOCK_ADMIN = '0xAbCd000000000000000000000000000000001234' as const;
export const MOCK_ORG_OWNER = '0x9999000000000000000000000000000000009999' as const;

export const mockOrgs: Org[] = [
  {
    id: 0,
    owner: MOCK_ORG_OWNER,
    name: 'Sunrise Primary School',
    description: 'Textbooks, meals and classroom repairs for 120 students in rural Maharashtra.',
    totalDonated: parseEther('0.1'),
    totalReleased: parseEther('0.02'),
    balance: parseEther('0.08'),
    donorCount: 3,
    createdAt: now - 86400 * 5,
  },
  {
    id: 1,
    owner: '0x7777000000000000000000000000000000007777',
    name: 'Clean Water Collective',
    description: 'Borewell + filtration unit for a village of 400.',
    totalDonated: parseEther('0.25'),
    totalReleased: 0n,
    balance: parseEther('0.25'),
    donorCount: 7,
    createdAt: now - 86400 * 2,
  },
  {
    id: 2,
    owner: MOCK_ADMIN,
    name: 'Street Animal Care',
    description: 'Vaccination drives and emergency vet care.',
    totalDonated: 0n,
    totalReleased: 0n,
    balance: 0n,
    donorCount: 0,
    createdAt: now - 3600,
  },
];

export const mockMilestones: Record<number, Milestone[]> = {
  0: [
    { id: 0, orgId: 0, description: 'Purchased 50 textbooks for Grade 5', amount: parseEther('0.02'), status: 'released', createdAt: now - 86400 * 3, releasedAt: now - 86400 * 2 },
    { id: 1, orgId: 0, description: 'School lunch program — week 1', amount: parseEther('0.015'), status: 'approved', createdAt: now - 86400, releasedAt: null },
    { id: 2, orgId: 0, description: 'Repair classroom roof', amount: parseEther('0.05'), status: 'pending', createdAt: now - 3600, releasedAt: null },
  ],
  1: [{ id: 0, orgId: 1, description: 'Borewell drilling contractor deposit', amount: parseEther('0.1'), status: 'pending', createdAt: now - 7200, releasedAt: null }],
  2: [],
};

export const mockPlatformStats: PlatformStats = {
  totalDonated: parseEther('0.35'),
  totalReleased: parseEther('0.02'),
  balance: parseEther('0.33'),
  orgCount: mockOrgs.length,
};

export const mockHistory: HistoryItem[] = [
  { kind: 'requested', orgId: 0, txHash: '0x3333333333333333333333333333333333333333333333333333333333333333', blockNumber: 1003n, milestoneId: 2, description: 'Repair classroom roof', amount: parseEther('0.05'), timestamp: now - 3600 },
  { kind: 'released', orgId: 0, txHash: '0x2222222222222222222222222222222222222222222222222222222222222222', blockNumber: 1002n, milestoneId: 0, amount: parseEther('0.02'), timestamp: now - 86400 * 2 },
  { kind: 'donated', orgId: 0, txHash: '0x1111111111111111111111111111111111111111111111111111111111111111', blockNumber: 1001n, actor: '0x8888000000000000000000000000000000008888', amount: parseEther('0.1'), message: 'For the kids 💙', timestamp: now - 86400 * 4 },
  { kind: 'orgCreated', orgId: 0, txHash: '0x0000000000000000000000000000000000000000000000000000000000000001', blockNumber: 1000n, actor: MOCK_ORG_OWNER, name: 'Sunrise Primary School', timestamp: now - 86400 * 5 },
];

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
