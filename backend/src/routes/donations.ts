import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, fail, ok } from '../lib/http.js';

export const donationsRouter = Router();
export const donorsRouter = Router();

const limitQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

donationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = limitQuery.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.message);
    const rows = await prisma.donation.findMany({
      orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }],
      take: parsed.data.limit,
    });
    ok(res, rows);
  }),
);

donorsRouter.get(
  '/top',
  asyncHandler(async (req, res) => {
    const parsed = limitQuery.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.message);

    // SQLite can't sum 256-bit strings; aggregate in JS. Fine at hackathon scale.
    const rows = await prisma.donation.findMany({ select: { donor: true, amount: true } });
    const totals = new Map<string, bigint>();
    for (const r of rows) totals.set(r.donor, (totals.get(r.donor) ?? 0n) + BigInt(r.amount));

    const top = [...totals.entries()]
      .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
      .slice(0, parsed.data.limit)
      .map(([donor, total]) => ({ donor, total: total.toString() }));

    ok(res, top);
  }),
);
