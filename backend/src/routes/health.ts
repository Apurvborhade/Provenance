import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, env } from '../env.js';
import { asyncHandler, ok } from '../lib/http.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const state = await prisma.indexerState.findUnique({ where: { id: 1 } });
    ok(res, {
      ok: true,
      chainId: 84532,
      contract: CONTRACT_ADDRESS,
      contractConfigured: CONTRACT_CONFIGURED,
      indexerEnabled: env.INDEXER_ENABLED,
      lastIndexedBlock: state?.lastBlock ?? null,
    });
  }),
);
