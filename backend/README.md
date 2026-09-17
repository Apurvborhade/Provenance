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
| GET | `/api/stats` |
| GET | `/api/donations?limit=50` |
| GET | `/api/donors/top?limit=10` |
| GET | `/api/milestones` |
| GET | `/api/milestones/:id` |
| GET | `/api/milestones/:id/metadata` |
| PUT | `/api/milestones/:id/metadata` |

Indexer: `src/services/indexer.ts` polls `getLogs` every `INDEXER_POLL_MS` from `CONTRACT_DEPLOY_BLOCK`, upserting rows. It stays idle until `CONTRACT_ADDRESS` is set.
