# 06 — 5-Hour Build Plan (two parallel lanes)

| Time | 🟣 Apurva | 🟢 Aditya |
|---|---|---|
| 0:00–0:20 | Write `DonationPlatform.sol` + tests, `forge test` green | `pnpm install` frontend + backend; UI kit (`Button`, `Card`, `Badge`, `Input`) with global CSS |
| 0:20–0:40 | Deploy to Base Sepolia, verify on Basescan, copy ABI/address into config | `format.ts`, `mock.ts`; `StatsBar` + `MilestoneTable` rendering mock data |
| **0:40** | **→ share address + ABI** | **← update backend `.env`** |
| 0:40–1:00 | `wagmi.ts`, `main.tsx`, `useDonationPlatform` reads; `ConnectButton` | `TxHistory`, empty/loading states, `App.tsx` shell with tabs |
| 1:00–1:45 | `useDonate` + `DonateForm` wired; first live donation from the UI | Prisma schema, `prisma:push`, express skeleton, `/api/health`, `/api/stats` |
| 1:45–2:30 | `useMilestoneActions` + `ManagePanel`; `useTxHistory` via getLogs; event watchers | `/api/orgs/...` routes, metadata PUT; seed script |
| 2:30–3:15 | Replace mocks in pages with real hooks; wrong-network handling | Indexer loop using Apurva's `lib/viem.ts`; `curl` tests; backend README |
| 3:15–3:45 | **Both:** end-to-end on testnet, fix bugs | |
| 3:45–4:15 | Fix any hook edge cases (tx rejected, RPC timeout) | Styling polish, loading/error states, responsive check |
| 4:15–4:45 | Rehearse driving the demo | Slides + demo script + 60s fallback recording |
| 4:45–5:00 | Buffer: RPC / wallet issues | Buffer |

## Cut order if running behind (cut from the top)

1. Backend indexer (keep seed data + static endpoints)
2. Backend entirely (frontend must already work without it)
3. `TxHistory` via getLogs (keep milestone table — it already shows status)
4. Styling polish
5. Org approve/release UI (keep donate + dashboard; do approve/release from Basescan "Write Contract" live — still verifiable)
6. Basescan verification (last resort; unverified contract still works)

## Definition of done for the demo

- [ ] Fresh browser: dashboard loads with live numbers, no wallet needed
- [ ] Donate 0.001 ETH → balance + total update within ~10s → tx link works
- [ ] Add milestone → Pending → Approve → Approved → Release → Released, balance drops
- [ ] Reload → same state
- [ ] Contract page on Basescan shows verified source
