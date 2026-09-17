import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, fail, ok } from '../lib/http.js';

export const milestonesRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().nonnegative() });

const metadataBody = z
  .object({
    receiptUrl: z.string().url().max(2048).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((b) => b.receiptUrl !== undefined || b.notes !== undefined, { message: 'Provide receiptUrl and/or notes' });

milestonesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.milestone.findMany({ orderBy: { id: 'asc' }, include: { metadata: true } });
    ok(res, rows);
  }),
);

milestonesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const p = idParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid id');
    const row = await prisma.milestone.findUnique({ where: { id: p.data.id }, include: { metadata: true } });
    if (!row) return fail(res, 'Not found', 404);
    ok(res, row);
  }),
);

milestonesRouter.get(
  '/:id/metadata',
  asyncHandler(async (req, res) => {
    const p = idParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid id');
    const meta = await prisma.milestoneMetadata.findUnique({ where: { milestoneId: p.data.id } });
    ok(res, meta ?? { milestoneId: p.data.id, receiptUrl: null, notes: null });
  }),
);

/**
 * Upsert off-chain metadata. NO AUTH in v1 — flag in demo as future scope
 * (would be: sign a message with the owner wallet, verify with viem.verifyMessage).
 */
milestonesRouter.put(
  '/:id/metadata',
  asyncHandler(async (req, res) => {
    const p = idParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid id');
    const b = metadataBody.safeParse(req.body);
    if (!b.success) return fail(res, b.error.issues.map((i) => i.message).join('; '));

    const exists = await prisma.milestone.findUnique({ where: { id: p.data.id } });
    if (!exists) return fail(res, 'Milestone not indexed yet', 404);

    const meta = await prisma.milestoneMetadata.upsert({
      where: { milestoneId: p.data.id },
      create: { milestoneId: p.data.id, receiptUrl: b.data.receiptUrl ?? null, notes: b.data.notes ?? null },
      update: { ...(b.data.receiptUrl !== undefined && { receiptUrl: b.data.receiptUrl }), ...(b.data.notes !== undefined && { notes: b.data.notes }) },
    });
    ok(res, meta);
  }),
);
