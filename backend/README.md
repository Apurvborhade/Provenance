# backend/ — Express + TypeScript + Prisma

Owner: **Aditya**. Spec: [`../docs/04-BACKEND.md`](../docs/04-BACKEND.md)

Optional layer: caches chain events into SQLite and stores off-chain milestone metadata. **The frontend must work without it.**

```bash
pnpm install
cp .env.example .env         # set CONTRACT_ADDRESS + CONTRACT_DEPLOY_BLOCK once deployed
pnpm prisma:generate
pnpm prisma:push             # creates prisma/dev.db
pnpm seed                    # optional fake data
pnpm dev                     # http://localhost:4000/api/health
```

Try the endpoints in `requests.http` (VS Code REST Client) or:

```bash
curl -s localhost:4000/api/stats | jq
curl -s -X PUT localhost:4000/api/milestones/0/metadata -H 'content-type: application/json' -d '{"notes":"Invoice #123"}' | jq
```

| Method | Path |
|---|---|
| GET | `/api/health` |
| GET | `/api/stats` — platform-wide |
| GET | `/api/donors/top?limit=10` — platform-wide |
| GET | `/api/orgs` — directory with per-org stats |
| GET | `/api/orgs/:orgId` |
| GET | `/api/orgs/:orgId/stats` |
| GET | `/api/orgs/:orgId/donations?limit=50` |
| GET | `/api/orgs/:orgId/donors/top?limit=10` |
| GET | `/api/orgs/:orgId/milestones` |
| GET | `/api/orgs/:orgId/milestones/:id/metadata` |
| PUT | `/api/orgs/:orgId/milestones/:id/metadata` |
| POST | `/api/orgs/:orgId/milestones/:id/receipt` — multipart `file` (pdf/png/jpg/webp/heic/txt, ≤10MB) → `{ hash, uri }` |
| GET | `/api/receipts/:filename` — serves the stored receipt; filename is `<keccak256><ext>` |

Receipts are stored on disk under `backend/uploads/` (gitignored), named by their keccak256 hash. Set `PUBLIC_URL` to the address other machines reach the server on — it's embedded in the on-chain `proofUri`.

Stats include `releasedCount`, `proofCount`, `proofRate` (0–100 or null) for the org reputation line.

Indexer: `src/services/indexer.ts` polls `getLogs` every `INDEXER_POLL_MS` from `CONTRACT_DEPLOY_BLOCK`, upserting orgs, donations, milestones and proofs. It stays idle until `CONTRACT_ADDRESS` is set.
