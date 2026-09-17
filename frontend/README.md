# frontend/ — Vite + React + TypeScript + wagmi/viem

Spec: [`../docs/03-FRONTEND.md`](../docs/03-FRONTEND.md) · Task split: [`../docs/05-TASK-SPLIT.md`](../docs/05-TASK-SPLIT.md)

```bash
pnpm install
cp .env.example .env
pnpm dev          # http://localhost:5173
pnpm typecheck
pnpm build
```

## Ownership

| Path | Owner |
|---|---|
| `src/config/**`, `src/hooks/**`, `ConnectButton`, `DonateForm`, `OrgPanel` | Apurva (chain) |
| `src/components/ui/**`, `StatsBar`, `MilestoneTable`, `TxHistory`, `src/lib/format.ts`, `src/lib/mock.ts`, `App.tsx`, pages, CSS | Aditya (UI) |
| `src/lib/types.ts` | shared — announce changes |

## Mock mode

`src/pages/*` currently import from `useDonationPlatform` etc. Set `VITE_USE_MOCK=true` in `.env` to render everything from `src/lib/mock.ts` without a wallet or RPC — useful while building UI.
