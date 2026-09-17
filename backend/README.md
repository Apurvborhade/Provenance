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
| GET | `/api/receipts/storage` — `{ storage: 'ipfs' \| 'local' }` |
| GET | `/api/receipts/:filename` — serves a local-fallback receipt; filename is `<keccak256><ext>` |

## Receipt storage (IPFS)

Set `PINATA_JWT` (free key: https://app.pinata.cloud/developers/api-keys → New Key → Admin or `pinFileToIPFS` scope) and receipts are pinned to IPFS; the on-chain `proofUri` becomes `ipfs://<cid>`, which any gateway can resolve forever. With no key, or if pinning fails and `IPFS_FALLBACK_LOCAL=true`, the file goes to `backend/uploads/` (gitignored) and `proofUri` is `PUBLIC_URL/api/receipts/<keccak256><ext>`. `GET /api/health` reports `receiptStorage: "ipfs" | "local"`.

Either way the on-chain `proofHash` is keccak256 of the bytes — verifiable by downloading from any gateway and re-hashing.

Stats include `releasedCount`, `proofCount`, `proofRate` (0–100 or null) for the org reputation line.

Indexer: `src/services/indexer.ts` polls `getLogs` every `INDEXER_POLL_MS` from `CONTRACT_DEPLOY_BLOCK`, upserting orgs, donations, milestones and proofs. It stays idle until `CONTRACT_ADDRESS` is set.
