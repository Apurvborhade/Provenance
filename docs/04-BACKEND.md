# 04 — Backend (Express + TypeScript + Prisma)

**Owner:** Aditya (with Apurva supplying the viem `getLogs` snippet for the indexer) · **Location:** `backend/` · **Dev:** `pnpm dev` → http://localhost:4000

## Why a backend exists at all

The demo does **not** need it. It exists to:

1. Give a clean non-Web3 lane of work (REST API, DB schema, data shaping, tests).
2. Cache chain events so the dashboard can show history / leaderboard without hammering the RPC.
3. Store **off-chain metadata** that doesn't belong on-chain: milestone receipt URLs, notes, org profile.
4. Be the natural home for Future Scope (IPFS pinning, analytics).

**Hard rule:** the frontend must render fully if this server is down. The one exception is **receipt upload** (`AttachProofForm`) — that needs somewhere to store the file, so the backend must be up for the proof step of the demo.

## Stack

- Node 20+, TypeScript, Express 4
- Prisma ORM on **Postgres** (Prisma Postgres, `DATABASE_URL` in `.env`). Same DB for local dev and hosted backend, so the indexer's cursor and the receipt metadata are shared.
- `viem` for the indexer (read-only, no private key needed)
- `zod` for request validation
- `cors`, `dotenv`

## Folder structure

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.ts              # express app, mounts routes, starts indexer
    ├── env.ts                # zod-validated env
    ├── lib/
    │   ├── prisma.ts         # PrismaClient singleton
    │   └── viem.ts           # publicClient for Base Sepolia
    ├── lib/aggregate.ts      # statsFor(orgId?), topDonors(orgId?, limit)
    ├── lib/storage.ts        # storeReceipt(): Pinata IPFS pin, local-disk fallback
    ├── routes/
    │   ├── health.ts         # GET /api/health
    │   ├── stats.ts          # GET /api/stats, /api/donors/top (platform-wide)
    │   ├── orgs.ts           # GET /api/orgs..., GET/PUT .../milestones/:id/metadata
    │   └── receipts.ts       # POST .../receipt (multer), GET /api/receipts/*
    └── services/
        └── indexer.ts        # polls getLogs, upserts into DB
```

## Prisma schema (summary)

| Model | Key | Purpose |
|---|---|---|
| `Org` | `id` (on-chain orgId) | owner, name, description, createdAt, createTxHash |
| `Donation` | `txHash` | orgId, donor, amount (wei string), message, blockNumber, timestamp |
| `Milestone` | `(orgId, id)` | mirrors chain + `requestTxHash` / `approveTxHash` / `releaseTxHash` |
| `MilestoneMetadata` | `(orgId, milestoneId)` | off-chain only: `receiptUrl?`, `notes?` |
| `IndexerState` | `id = 1` | `lastBlock` cursor |

Amounts are stored as **string** (wei) — JS `number` loses precision above 2^53 and Postgres `numeric` would need casting everywhere; strings + `BigInt` at the edges is simplest.

## REST endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ ok, chainId, contract, contractConfigured, lastIndexedBlock }` |
| GET | `/api/stats` | platform-wide `{ totalDonated, totalReleased, balance, donorCount, milestoneCount, orgCount }` |
| GET | `/api/donors/top?limit=10` | platform-wide `[{ donor, total }]` |
| GET | `/api/orgs` | all orgs, each with a `stats` object |
| GET | `/api/orgs/:orgId` | one org + stats |
| GET | `/api/orgs/:orgId/stats` | per-org stats |
| GET | `/api/orgs/:orgId/donations?limit=50` | latest donations with messages + tx hashes |
| GET | `/api/orgs/:orgId/donors/top?limit=10` | per-org leaderboard |
| GET | `/api/orgs/:orgId/milestones` | milestones joined with metadata |
| GET | `/api/orgs/:orgId/milestones/:id/metadata` | `{ receiptUrl, notes }` |
| PUT | `/api/orgs/:orgId/milestones/:id/metadata` | body `{ receiptUrl?, notes? }` → upsert. **No auth in v1** — future: org owner signs a message, verify against `Org.owner` |
| POST | `/api/orgs/:orgId/milestones/:id/receipt` | multipart `file` → server keccak256 → **pin to IPFS** (Pinata) → `{ hash, uri: "ipfs://<cid>", url, storage, cid, size, mimetype }`. 201. Falls back to local disk if no `PINATA_JWT` / pin fails. |
| GET | `/api/receipts/storage` | `{ storage: "ipfs" \| "local" }` |
| GET | `/api/receipts/:filename` | local-fallback file; name must be `0x<64 hex>.<ext>` |

All responses: `{ data: ... }` or `{ error: string }`. Aggregation lives in `src/lib/aggregate.ts` (sums done in JS with `BigInt`).

## Indexer (`services/indexer.ts`)

```
loop every INDEXER_POLL_MS (default 10s):
  from = IndexerState.lastBlock + 1  (or CONTRACT_DEPLOY_BLOCK on first run)
  to   = latest block
  for each event (OrgCreated, OrgUpdated, Donated, MilestoneRequested, MilestoneApproved, MilestoneReleased):
      logs = publicClient.getLogs({ address, event, fromBlock, toBlock })
      upsert rows
  IndexerState.lastBlock = to
```

Apurva provides the `getLogs` + ABI event definitions; Aditya writes the upsert logic and the loop. Keep chunk size ≤ 10 000 blocks per call for public RPC limits.

## Scripts

```bash
pnpm dev            # ts-node-dev with reload
pnpm build          # tsc
pnpm start          # node dist/index.js
pnpm prisma:push    # prisma db push against DATABASE_URL
pnpm prisma:studio  # browse the DB
```

## Env

```
PORT=4000
PUBLIC_URL=http://localhost:4000      # only used for local-fallback receipt URIs
DATABASE_URL="postgresql://…?sslmode=require"   # Prisma Postgres; never commit
PINATA_JWT=                            # set → receipts pinned to IPFS, ipfs://<cid> on-chain
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
IPFS_FALLBACK_LOCAL=true
RPC_URL=https://sepolia.base.org
CONTRACT_ADDRESS=0x...
CONTRACT_DEPLOY_BLOCK=0
INDEXER_POLL_MS=10000
INDEXER_ENABLED=true
```
