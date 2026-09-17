// Fake data so endpoints return something before the contract has activity. `pnpm seed`
import { PrismaClient } from '@prisma/client';
import { parseEther } from 'viem';

const prisma = new PrismaClient();
const now = Math.floor(Date.now() / 1000);
const h = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
const OWNER_A = '0x9999000000000000000000000000000000009999';
const OWNER_B = '0x7777000000000000000000000000000000007777';

async function main() {
  await prisma.milestoneMetadata.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.org.deleteMany();

  await prisma.org.createMany({
    data: [
      { id: 0, owner: OWNER_A, name: 'Sunrise Primary School', description: 'Textbooks, meals and classroom repairs for 120 students.', createdAt: now - 86400 * 5, createTxHash: h(100) },
      { id: 1, owner: OWNER_B, name: 'Clean Water Collective', description: 'Borewell + filtration unit for a village of 400.', createdAt: now - 86400 * 2, createTxHash: h(101) },
    ],
  });

  await prisma.donation.createMany({
    data: [
      { txHash: h(1), logIndex: 0, orgId: 0, donor: '0x8888000000000000000000000000000000008888', amount: parseEther('0.05').toString(), message: 'For the kids 💙', blockNumber: 1001, timestamp: now - 86400 * 4 },
      { txHash: h(2), logIndex: 0, orgId: 0, donor: '0x6666000000000000000000000000000000006666', amount: parseEther('0.03').toString(), message: '', blockNumber: 1002, timestamp: now - 86400 * 3 },
      { txHash: h(3), logIndex: 0, orgId: 0, donor: '0x8888000000000000000000000000000000008888', amount: parseEther('0.02').toString(), message: 'Again!', blockNumber: 1005, timestamp: now - 86400 },
      { txHash: h(4), logIndex: 0, orgId: 1, donor: '0x5555000000000000000000000000000000005555', amount: parseEther('0.25').toString(), message: 'Water is life', blockNumber: 1006, timestamp: now - 3600 * 5 },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { orgId: 0, id: 0, description: 'Purchased 50 textbooks for Grade 5', amount: parseEther('0.02').toString(), status: 'released', createdAt: now - 86400 * 3, releasedAt: now - 86400 * 2, requestTxHash: h(10), approveTxHash: h(11), releaseTxHash: h(12) },
      { orgId: 0, id: 1, description: 'School lunch program — week 1', amount: parseEther('0.015').toString(), status: 'approved', createdAt: now - 86400, requestTxHash: h(20), approveTxHash: h(21) },
      { orgId: 0, id: 2, description: 'Repair classroom roof', amount: parseEther('0.05').toString(), status: 'pending', createdAt: now - 3600, requestTxHash: h(30) },
      { orgId: 1, id: 0, description: 'Borewell drilling contractor deposit', amount: parseEther('0.1').toString(), status: 'pending', createdAt: now - 7200, requestTxHash: h(40) },
    ],
  });

  await prisma.milestoneMetadata.create({
    data: { orgId: 0, milestoneId: 0, receiptUrl: 'https://example.com/receipts/textbooks.pdf', notes: 'Invoice #4521 from City Books' },
  });

  console.log('Seeded 2 orgs, 4 donations, 4 milestones, 1 metadata row');
}

main().finally(() => prisma.$disconnect());
