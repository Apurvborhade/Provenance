import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, ok } from '../lib/http.js';

export const statsRouter = Router();

/** Aggregates computed from indexed rows. Amounts returned as wei strings. */
statsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [donations, released, donors, milestoneCount] = await Promise.all([
      prisma.donation.findMany({ select: { amount: true } }),
      prisma.milestone.findMany({ where: { status: 'released' }, select: { amount: true } }),
      prisma.donation.groupBy({ by: ['donor'] }),
      prisma.milestone.count(),
    ]);

    const sum = (rows: { amount: string }[]) => rows.reduce((acc, r) => acc + BigInt(r.amount), 0n);
    const totalDonated = sum(donations);
    const totalReleased = sum(released);

    ok(res, {
      totalDonated: totalDonated.toString(),
      totalReleased: totalReleased.toString(),
      balance: (totalDonated - totalReleased).toString(),
      donorCount: donors.length,
      milestoneCount,
    });
  }),
);
