# 05 — Task Split

Two lanes that can run **fully in parallel** for the first ~3 hours. The contract-address hand-off (Apurva → Aditya) is the only sync point.

- **Apurva** — everything that touches a private key, a wallet, a transaction, or an RPC call.
- **Aditya** — everything that doesn't. UI, styling, backend API, DB, docs, demo.

The interface between the two lanes is **plain TypeScript props/types** (`frontend/src/lib/types.ts`) and **`mock.ts`**. Aditya builds every screen against mock data; Apurva swaps mock → real hooks.

---

## 🟣 Apurva — Core Web3

### A1. Smart contract (contracts/)
- [ ] Implement `src/DonationTracker.sol` per `02-SMART-CONTRACT.md` (skeleton already in repo)
- [ ] Write `test/DonationTracker.t.sol` — all 12 tests in the test plan pass
- [ ] `forge fmt`, `forge build` clean, no warnings
- [ ] Gas-snapshot once (`forge snapshot`) just to have it in the repo

### A2. Deploy + verify
- [ ] Fund deployer wallet on Base Sepolia (faucet)
- [ ] `script/Deploy.s.sol` + `forge script ... --broadcast --verify`
- [ ] Confirm "Contract Source Code Verified" on Basescan
- [ ] Paste address + ABI into `frontend/src/config/contract.ts`
- [ ] Paste address + deploy block into `backend/.env.example` and tell Aditya
- [ ] Do one real `donate()` and one full milestone cycle via Basescan "Write Contract" so there's seed data on-chain

### A3. Frontend chain wiring (frontend/src/config + hooks)
- [ ] `config/wagmi.ts` — baseSepolia, injected connector, http transport
- [ ] `main.tsx` — WagmiProvider + QueryClientProvider
- [ ] `hooks/useDonationTracker.ts` — owner, totalDonated, balance, milestones (mapped to `Milestone[]` type), `isOwner`
- [ ] `hooks/useDonate.ts` — write + wait for receipt, expose `{ donate, hash, isPending, isConfirming, isSuccess, error }`
- [ ] `hooks/useMilestoneActions.ts` — add / approve / release, same shape
- [ ] `hooks/useTxHistory.ts` — `getLogs` for the 4 events from deploy block → `HistoryItem[]`, sorted desc
- [ ] `useWatchContractEvent` on all 4 events → invalidate queries
- [ ] Wrong-network detection + `useSwitchChain` button

### A4. Wire hooks into Aditya's components
- [ ] `ConnectButton.tsx` (useConnect / useDisconnect / useAccount)
- [ ] `DonateForm.tsx` — calls `useDonate`, passes states to Aditya's `<Button>` / `<Toast>`
- [ ] `OrgPanel.tsx` — gated on `isOwner`, calls `useMilestoneActions`
- [ ] Replace `mock.ts` imports in pages with real hooks
- [ ] End-to-end on testnet: donate → add → approve → release → reload page → state persists

### A5. Indexer snippet for backend
- [ ] Give Aditya `backend/src/lib/viem.ts` + the `parseAbiItem` event definitions (already scaffolded — just confirm they match the final ABI)

### A6. Demo driving
- [ ] Run the live transactions during the demo; have 2 browser profiles (donor / org) ready if 2 wallets available

---

## 🟢 Aditya — UI, Backend, Docs (no Web3 knowledge required)

### B1. Frontend UI kit (frontend/src/components/ui/)
- [ ] `Button` — variants primary/secondary/danger, `loading` prop shows spinner, `disabled`
- [ ] `Card`, `Badge` (pending=amber, approved=blue, released=green), `Input`, `Spinner`, `Table`, `Toast`
- [ ] `index.css` — CSS variables (colours, spacing), dark-ish clean theme, responsive at 400px
- [ ] No wagmi imports anywhere in `ui/`

### B2. Frontend data components (props in, JSX out)
- [ ] `StatsBar.tsx` — 4 tiles: Total Donated, Current Balance, Total Released, Milestones. Props are `bigint` wei → use `formatEth`
- [ ] `MilestoneTable.tsx` — columns: #, Description, Amount, Status badge, Created, Actions slot (render-prop so Apurva can inject Approve/Release buttons), tx link
- [ ] `TxHistory.tsx` — unified event list, newest first, each row links to Basescan via `txUrl`
- [ ] Empty states, skeleton loaders, error banner component
- [ ] Build all of the above against `lib/mock.ts` in `DashboardPage.tsx` first

### B3. Frontend utilities (frontend/src/lib/)
- [ ] `format.ts` — `formatEth(wei: bigint, decimals=4)`, `shortAddr`, `txUrl`, `addrUrl`, `formatDate(unix)`, `timeAgo`
- [ ] `types.ts` (already defined — extend if needed, tell Apurva)
- [ ] `mock.ts` — realistic sample milestones + history
- [ ] `api.ts` — typed fetch helpers for backend, each returns `null` on failure

### B4. App shell & pages
- [ ] `App.tsx` — header (logo, network pill, `<ConnectButton />` slot), 3 tabs: Dashboard / Donate / Org
- [ ] `DashboardPage`, `DonatePage`, `OrgPage` layouts
- [ ] "Verify on Basescan" banner with the contract address link at the top of Dashboard
- [ ] Footer: "All data read live from Base Sepolia · nothing is self-reported"

### B5. Backend (backend/)
- [ ] `prisma/schema.prisma` per `04-BACKEND.md`, `pnpm prisma:push` works
- [ ] `src/index.ts` express app, cors, json, error handler
- [ ] `routes/health.ts`, `routes/stats.ts`, `routes/donations.ts`, `routes/milestones.ts` with zod validation
- [ ] `services/indexer.ts` — loop + upserts (Apurva's viem client + event defs are already in `lib/viem.ts`)
- [ ] Seed script `prisma/seed.ts` with fake data so endpoints return something before the contract is deployed
- [ ] Manual test with `curl` / a `.http` file; put example requests in `backend/README.md`

### B6. Docs, demo & polish
- [ ] Slides: Problem → Solution → Architecture diagram → Live demo → Future scope (5–6 slides max)
- [ ] `07-DEMO-SCRIPT.md` refined with exact click-by-click steps + backup plan if RPC dies (screenshots/recording)
- [ ] Record a 60-second screen capture of the working flow as a fallback
- [ ] Root `README.md` polish, screenshots
- [ ] Final styling pass 3:45–4:15

---

## Sync points

| When | What |
|---|---|
| **0:40** | Apurva shares contract address + ABI. Aditya updates `backend/.env` |
| **2:30** | Apurva starts replacing mock imports with hooks in Aditya's pages. Aditya moves to backend / slides |
| **3:15** | Both: end-to-end test on testnet |
| **4:15** | Both: demo dry run |

## Rules to avoid stepping on each other

1. Aditya never edits `contracts/`, `frontend/src/config/`, `frontend/src/hooks/`.
2. Apurva never edits `frontend/src/components/ui/`, `frontend/src/lib/format.ts`, `backend/src/routes/`.
3. Shared file `frontend/src/lib/types.ts` — announce before changing.
4. Commit small, commit often, prefix messages `[contract]`, `[fe]`, `[be]`, `[docs]`.
