// Shared aggregation helpers. SQLite can't sum 256-bit strings, so we reduce in JS (fine at hackathon scale).
import { prisma } from './prisma.js';

export const sumWei = (rows: { amount: string }[]) => rows.reduce((acc, r) => acc + BigInt(r.amount), 0n);

export async function statsFor(orgId?: number) {
  const where = orgId === undefined ? {} : { orgId };
  const [donations, released, donors, milestoneCount, orgCount] = await Promise.all([
    prisma.donation.findMany({ where, select: { amount: true } }),
    prisma.milestone.findMany({ where: { ...where, status: 'released' }, select: { amount: true } }),
    prisma.donation.groupBy({ by: ['donor'], where }),
    prisma.milestone.count({ where }),
    orgId === undefined ? prisma.org.count() : Promise.resolve(1),
  ]);
  const totalDonated = sumWei(donations);
  const totalReleased = sumWei(released);
  return {
    totalDonated: totalDonated.toString(),
    totalReleased: totalReleased.toString(),
    balance: (totalDonated - totalReleased).toString(),
    donorCount: donors.length,
    milestoneCount,
    orgCount,
  };
}

export async function topDonors(orgId: number | undefined, limit: number) {
  const rows = await prisma.donation.findMany({ where: orgId === undefined ? {} : { orgId }, select: { donor: true, amount: true } });
  const totals = new Map<string, bigint>();
  for (const r of rows) totals.set(r.donor, (totals.get(r.donor) ?? 0n) + BigInt(r.amount));
  return [...totals.entries()]
    .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
    .slice(0, limit)
    .map(([donor, total]) => ({ donor, total: total.toString() }));
}
