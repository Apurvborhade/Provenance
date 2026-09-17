// Fake data so endpoints return something before the contract is deployed. `pnpm seed`
import { PrismaClient } from '@prisma/client';
import { parseEther } from 'viem';

const prisma = new PrismaClient();
const now = Math.floor(Date.now() / 1000);
const h = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;

async function main() {
  await prisma.milestoneMetadata.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.donation.deleteMany();

  await prisma.donation.createMany({
    data: [
      { txHash: h(1), logIndex: 0, donor: '0x9999000000000000000000000000000000009999', amount: parseEther('0.05').toString(), blockNumber: 1001, timestamp: now - 86400 * 4 },
      { txHash: h(2), logIndex: 0, donor: '0x8888000000000000000000000000000000008888', amount: parseEther('0.03').toString(), blockNumber: 1002, timestamp: now - 86400 * 3 },
      { txHash: h(3), logIndex: 0, donor: '0x9999000000000000000000000000000000009999', amount: parseEther('0.02').toString(), blockNumber: 1005, timestamp: now - 86400 },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { id: 0, description: 'Purchased 50 textbooks for Grade 5', amount: parseEther('0.02').toString(), status: 'released', createdAt: now - 86400 * 3, releasedAt: now - 86400 * 2, requestTxHash: h(10), approveTxHash: h(11), releaseTxHash: h(12) },
      { id: 1, description: 'School lunch program — week 1', amount: parseEther('0.015').toString(), status: 'approved', createdAt: now - 86400, requestTxHash: h(20), approveTxHash: h(21) },
      { id: 2, description: 'Repair classroom roof', amount: parseEther('0.05').toString(), status: 'pending', createdAt: now - 3600, requestTxHash: h(30) },
    ],
  });

  await prisma.milestoneMetadata.create({
    data: { milestoneId: 0, receiptUrl: 'https://example.com/receipts/textbooks.pdf', notes: 'Invoice #4521 from City Books' },
  });

  console.log('Seeded 3 donations, 3 milestones, 1 metadata row');
}

main().finally(() => prisma.$disconnect());
