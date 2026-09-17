import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { statsFor, topDonors } from '../lib/aggregate.js';

export const orgsRouter = Router();

const orgParam = z.object({ orgId: z.coerce.number().int().nonnegative() });
const milestoneParam = orgParam.extend({ id: z.coerce.number().int().nonnegative() });
const limitQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

const metadataBody = z
  .object({
    receiptUrl: z.string().url().max(2048).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((b) => b.receiptUrl !== undefined || b.notes !== undefined, { message: 'Provide receiptUrl and/or notes' });

// GET /api/orgs — directory with per-org totals
orgsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.org.findMany({ orderBy: { id: 'asc' } });
    const enriched = await Promise.all(orgs.map(async (o) => ({ ...o, stats: await statsFor(o.id) })));
    ok(res, enriched);
  }),
);

// GET /api/orgs/:orgId
orgsRouter.get(
  '/:orgId',
  asyncHandler(async (req, res) => {
    const p = orgParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid orgId');
    const org = await prisma.org.findUnique({ where: { id: p.data.orgId } });
    if (!org) return fail(res, 'Not found', 404);
    ok(res, { ...org, stats: await statsFor(org.id) });
  }),
);

orgsRouter.get(
  '/:orgId/stats',
  asyncHandler(async (req, res) => {
    const p = orgParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid orgId');
    ok(res, await statsFor(p.data.orgId));
  }),
);

orgsRouter.get(
  '/:orgId/donations',
  asyncHandler(async (req, res) => {
    const p = orgParam.safeParse(req.params);
    const q = limitQuery.safeParse(req.query);
    if (!p.success || !q.success) return fail(res, 'Invalid params');
    ok(res, await prisma.donation.findMany({ where: { orgId: p.data.orgId }, orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }], take: q.data.limit }));
  }),
);

orgsRouter.get(
  '/:orgId/donors/top',
  asyncHandler(async (req, res) => {
    const p = orgParam.safeParse(req.params);
    const q = limitQuery.safeParse(req.query);
    if (!p.success || !q.success) return fail(res, 'Invalid params');
    ok(res, await topDonors(p.data.orgId, q.data.limit));
  }),
);

orgsRouter.get(
  '/:orgId/milestones',
  asyncHandler(async (req, res) => {
    const p = orgParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid orgId');
    ok(res, await prisma.milestone.findMany({ where: { orgId: p.data.orgId }, orderBy: { id: 'asc' }, include: { metadata: true } }));
  }),
);

orgsRouter.get(
  '/:orgId/milestones/:id/metadata',
  asyncHandler(async (req, res) => {
    const p = milestoneParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid params');
    const meta = await prisma.milestoneMetadata.findUnique({ where: { orgId_milestoneId: { orgId: p.data.orgId, milestoneId: p.data.id } } });
    ok(res, meta ?? { orgId: p.data.orgId, milestoneId: p.data.id, receiptUrl: null, notes: null });
  }),
);

/**
 * Upsert off-chain metadata. NO AUTH in v1 — flag in demo as future scope
 * (would be: org owner signs a message, verify with viem.verifyMessage against Org.owner).
 */
orgsRouter.put(
  '/:orgId/milestones/:id/metadata',
  asyncHandler(async (req, res) => {
    const p = milestoneParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid params');
    const b = metadataBody.safeParse(req.body);
    if (!b.success) return fail(res, b.error.issues.map((i) => i.message).join('; '));

    const key = { orgId: p.data.orgId, milestoneId: p.data.id };
    const exists = await prisma.milestone.findUnique({ where: { orgId_id: { orgId: key.orgId, id: key.milestoneId } } });
    if (!exists) return fail(res, 'Milestone not indexed yet', 404);

    const meta = await prisma.milestoneMetadata.upsert({
      where: { orgId_milestoneId: key },
      create: { ...key, receiptUrl: b.data.receiptUrl ?? null, notes: b.data.notes ?? null },
      update: { ...(b.data.receiptUrl !== undefined && { receiptUrl: b.data.receiptUrl }), ...(b.data.notes !== undefined && { notes: b.data.notes }) },
    });
    ok(res, meta);
  }),
);
