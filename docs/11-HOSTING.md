# 11 — Hosting

| Piece | Host | Why |
|---|---|---|
| `frontend/` | **Vercel** (free) | Static Vite build; hash router needs no rewrites |
| `backend/` | **Railway** | Long-running Node process (indexer loop). DB is hosted Postgres, receipts are on IPFS, so no volume is needed |
| contract | Base Sepolia | already deployed + verified |

Order matters: deploy the backend first (you need its URL for the frontend's `VITE_API_URL`).

## 1. Backend → Railway

```bash
npm i -g @railway/cli
railway login                                  # opens browser
cd backend
railway init                                   # create a new project, name it "provenance-api"
railway variables set \
  DATABASE_URL="<the Prisma Postgres URL from backend/.env>" \
  RPC_URL="https://sepolia.base.org" \
  CONTRACT_ADDRESS="0xd38Fa0f8932025b5a8F996b5DE76e0a8480D5280" \
  CONTRACT_DEPLOY_BLOCK="46956091" \
  INDEXER_ENABLED="true" \
  PINATA_JWT="<your pinata jwt>" \
  IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs"
railway up                                     # builds + deploys from backend/
railway domain                                 # prints https://provenance-api-xxxx.up.railway.app
railway variables set PUBLIC_URL="https://<that domain>"
```

`backend/railway.json` sets build/start; `start:prod` runs `prisma db push` then boots. Check: `curl https://<domain>/api/health` → `contractConfigured: true`, `receiptStorage: "ipfs"`.

Alternative without CLI: railway.app → New Project → Deploy from GitHub → pick the repo → **Settings → Root Directory = `backend`** → add the variables above.

## 2. Frontend → Vercel

```bash
npm i -g vercel
vercel login
cd frontend
vercel                                         # first run: link project, accept defaults (framework: Vite)
vercel env add VITE_API_URL production         # paste the Railway URL, no trailing slash
vercel env add VITE_RPC_URL production         # https://sepolia.base.org, or an Alchemy URL
vercel env add VITE_IPFS_GATEWAY production    # https://gateway.pinata.cloud/ipfs
vercel --prod                                  # builds with the env vars, prints the live URL
```

Alternative without CLI: vercel.com → Add New → Project → import the repo → **Root Directory = `frontend`** → Environment Variables as above → Deploy.

Vite bakes `VITE_*` in at build time — after changing one, run `vercel --prod` again.

## 3. Wire up + verify

1. Open the Vercel URL. The hero receipt should read live from chain (no "backend" needed for that).
2. Manage → Attach proof should work — that's the only backend-dependent step. If it says "Backend not configured", `VITE_API_URL` didn't make it into the build.
3. Put the Vercel URL in `README.md` and the demo script.

## Gotchas

- **CORS** is wide open (`cors()`), so any frontend origin can call the API. Fine for the hackathon.
- **Railway sleeps?** No — Railway keeps the process up; the indexer keeps polling. Render's free tier sleeps after 15 min and would stall the indexer.
- **Redeploying the contract** later = update `CONTRACT_ADDRESS` + `CONTRACT_DEPLOY_BLOCK` on Railway *and* `frontend/src/config/contract.ts` → `vercel --prod`. Then clear the DB so the indexer starts fresh: `pnpm prisma db push --force-reset` (wipes all tables).
- **Local dev and Railway share one Postgres.** Don't run two indexers against it at once — stop `pnpm dev` locally while the hosted one is up, or point local at a second database.
- **Public RPC rate limits** hit harder on a public URL. If the receipt panel or history stalls, put an Alchemy Base Sepolia URL in `VITE_RPC_URL` and `RPC_URL`.
