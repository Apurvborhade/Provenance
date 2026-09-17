import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { statsFor, topDonors } from '../lib/aggregate.js';

export const statsRouter = Router();
export const donorsRouter = Router();

const limitQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(10) });

/** Platform-wide aggregates. Amounts returned as wei strings. */
statsRouter.get('/', asyncHandler(async (_req, res) => ok(res, await statsFor())));

donorsRouter.get(
  '/top',
  asyncHandler(async (req, res) => {
    const p = limitQuery.safeParse(req.query);
    if (!p.success) return fail(res, p.error.message);
    ok(res, await topDonors(undefined, p.data.limit));
  }),
);
