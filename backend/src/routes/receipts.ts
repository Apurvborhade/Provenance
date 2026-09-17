// Receipt storage for proof-of-spend. The file is hashed server-side (keccak256) and stored by hash,
// so the URL the org puts on-chain is content-addressed: same bytes → same hash → same URL.
// The frontend hashes the file independently and refuses to proceed if the two hashes differ.
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { keccak256 } from 'viem';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { env } from '../env.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'text/plain']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.has(file.mimetype)),
});

const milestoneParam = z.object({
  orgId: z.coerce.number().int().nonnegative(),
  id: z.coerce.number().int().nonnegative(),
});

const extFor = (mime: string, original: string) =>
  ({ 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/heic': '.heic', 'text/plain': '.txt' })[mime] ??
  path.extname(original).toLowerCase();

export const receiptsRouter = Router();

/**
 * POST /api/orgs/:orgId/milestones/:id/receipt  (multipart, field "file")
 * → { hash, uri, size, mimetype }
 * No auth in v1 (the on-chain attachProof is what's gated — only the org owner can commit the hash).
 */
receiptsRouter.post(
  '/orgs/:orgId/milestones/:id/receipt',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const p = milestoneParam.safeParse(req.params);
    if (!p.success) return fail(res, 'Invalid params');
    if (!req.file) return fail(res, `No file, or unsupported type. Allowed: ${[...ALLOWED].join(', ')}`);

    const hash = keccak256(req.file.buffer);
    const ext = extFor(req.file.mimetype, req.file.originalname);
    const filename = `${hash}${ext}`;
    const dest = path.join(UPLOAD_DIR, filename);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    if (!existsSync(dest)) await fs.writeFile(dest, req.file.buffer);

    const uri = `${env.PUBLIC_URL}/api/receipts/${filename}`;

    // Mirror into off-chain metadata so /milestones shows the receipt even before the tx is indexed.
    await prisma.milestoneMetadata
      .upsert({
        where: { orgId_milestoneId: { orgId: p.data.orgId, milestoneId: p.data.id } },
        create: { orgId: p.data.orgId, milestoneId: p.data.id, receiptUrl: uri },
        update: { receiptUrl: uri },
      })
      .catch(() => undefined); // milestone may not be indexed yet — fine

    ok(res, { hash, uri, size: req.file.size, mimetype: req.file.mimetype }, 201);
  }),
);

/** GET /api/receipts/:filename — the stored file. Filename is <keccak256><ext>, so it's tamper-evident by construction. */
receiptsRouter.get(
  '/receipts/:filename',
  asyncHandler(async (req, res) => {
    const name = String(req.params.filename);
    if (!/^0x[0-9a-f]{64}\.[a-z0-9]{2,5}$/.test(name)) return fail(res, 'Bad receipt name', 404);
    const file = path.join(UPLOAD_DIR, name);
    if (!existsSync(file)) return fail(res, 'Not found', 404);
    res.sendFile(file);
  }),
);
