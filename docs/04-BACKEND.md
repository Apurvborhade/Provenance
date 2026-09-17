# 04 — Backend (Express + TypeScript + Prisma)

**Owner:** Aditya (with Apurva supplying the viem `getLogs` snippet for the indexer) · **Location:** `backend/` · **Dev:** `pnpm dev` → http://localhost:4000

## Why a backend exists at all

The demo does **not** need it. It exists to:

1. Give a clean non-Web3 lane of work (REST API, DB schema, data shaping, tests).
2. Cache chain events so the dashboard can show history / leaderboard without hammering the RPC.
3. Store **off-chain metadata** that doesn't belong on-chain: milestone receipt URLs, notes, org profile.
4. Be the natural home for Future Scope (IPFS pinning, analytics).

**Hard rule:** the frontend must render fully if this server is down.

## Stack

- Node 20+, TypeScript, Express 4
- Prisma ORM, **SQLite** by default (`file:./dev.db`) — switch `provider` to `postgresql` in `schema.prisma` if a Postgres URL is available. Zero infra for the hackathon.
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
    ├── routes/
    │   ├── health.ts         # GET /api/health
    │   ├── stats.ts          # GET /api/stats
    │   ├── donations.ts      # GET /api/donations, GET /api/donors/top
    │   └── milestones.ts     # GET /api/milestones, GET/PUT /api/milestones/:id/metadata
    └── services/
        └── indexer.ts        # polls getLogs, upserts into DB
```

## Prisma schema (summary)

| Model | Fields | Purpose |
|---|---|---|
| `Donation` | `txHash` (pk), `donor`, `amount` (string wei), `blockNumber`, `timestamp` | one row per `Donated` event |
| `Milestone` | `id` (pk = on-chain id), `description`, `amount`, `status`, `createdAt`, `releasedAt`, `requestTxHash`, `approveTxHash`, `releaseTxHash` | mirrors chain + tx hashes per step |
| `MilestoneMetadata` | `milestoneId` (pk, fk), `receiptUrl?`, `notes?`, `updatedAt` | off-chain only |
| `IndexerState` | `id` (pk = 1), `lastBlock` | cursor so we don't rescan from genesis |

Amounts are stored as **string** (wei) — SQLite has no 256-bit ints and JS `number` loses precision.

## REST endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ ok: true, chainId, contract, lastIndexedBlock }` |
| GET | `/api/stats` | `{ totalDonated, totalReleased, balance, donorCount, milestoneCount }` (strings in wei) |
| GET | `/api/donations?limit=50` | latest donations with tx hashes |
| GET | `/api/donors/top?limit=10` | `[{ donor, total }]` aggregated |
| GET | `/api/milestones` | all milestones joined with metadata |
| GET | `/api/milestones/:id/metadata` | `{ receiptUrl, notes }` |
| PUT | `/api/milestones/:id/metadata` | body `{ receiptUrl?, notes? }` → upsert. (No auth in v1 — note it in the demo as Future Scope) |

All responses: `{ data: ... }` or `{ error: string }`.

## Indexer (`services/indexer.ts`)

```
loop every INDEXER_POLL_MS (default 10s):
  from = IndexerState.lastBlock + 1  (or CONTRACT_DEPLOY_BLOCK on first run)
  to   = latest block
  for each event type (Donated, MilestoneRequested, MilestoneApproved, MilestoneReleased):
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
pnpm prisma:push    # prisma db push (creates dev.db)
pnpm prisma:studio  # browse the DB
```

## Env

```
PORT=4000
DATABASE_URL="file:./dev.db"
RPC_URL=https://sepolia.base.org
CONTRACT_ADDRESS=0x...
CONTRACT_DEPLOY_BLOCK=0
INDEXER_POLL_MS=10000
INDEXER_ENABLED=true
```
