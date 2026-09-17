# Provenance — agent guide

Hackathon project (Hack2Ignite WB-05): on-chain donation + milestone-release tracker on Base Sepolia.

**Read `docs/README.md` first**, then the doc for the area you're touching. `docs/05-TASK-SPLIT.md` says who owns what — respect the ownership boundaries listed there.

## Layout
- `contracts/` — Foundry. `forge test` must stay green (20 tests). Contract spec: `docs/02-SMART-CONTRACT.md`.
- `frontend/` — Vite + React + TS + wagmi/viem. `pnpm typecheck` + `pnpm build` must pass. Spec: `docs/03-FRONTEND.md`.
- `backend/` — Express + TS + Prisma (SQLite). Optional; frontend must work without it. Spec: `docs/04-BACKEND.md`.

## Hard rules
- `frontend/src/components/ui/*`, `StatsBar`, `MilestoneTable`, `TxHistory` never import wagmi — props only.
- Amounts: `bigint` wei in frontend, `string` wei in backend/DB. Format only at display (`lib/format.ts`).
- Every contract state change emits an event. Custom errors, not revert strings. Checks-effects-interactions.
- Never commit `.env`, `*.db`, private keys.
- After deploying: update `frontend/src/config/contract.ts` (address, deploy block, ABI) and `backend/.env`.

## Commands
```bash
cd contracts && forge test
cd frontend  && pnpm typecheck && pnpm build
cd backend   && pnpm typecheck
```
