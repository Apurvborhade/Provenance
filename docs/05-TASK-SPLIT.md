# 05 — Task Split

Two lanes that can run **fully in parallel** for the first ~3 hours. The contract-address hand-off (Apurva → Aditya) is the only sync point.

- **Apurva** — everything that touches a private key, a wallet, a transaction, or an RPC call.
- **Aditya** — everything that doesn't. UI, styling, backend API, DB, docs, demo.

The interface between the two lanes is **plain TypeScript props/types** (`frontend/src/lib/types.ts`) and **`mock.ts`**. Aditya builds every screen against mock data; Apurva swaps mock → real hooks.

---

## 🟣 Apurva — Core Web3

### A1. Smart contract (contracts/)
- [x] Implement `src/DonationPlatform.sol` per `02-SMART-CONTRACT.md` (multi-org, admin approves)
- [x] `test/DonationPlatform.t.sol` — 35 tests pass (incl. payee, proof, sequencing)
- [ ] `forge fmt`, `forge build` clean, no warnings
- [ ] Gas-snapshot once (`forge snapshot`) just to have it in the repo

### A2. Deploy + verify
- [ ] Fund deployer wallet on Base Sepolia (faucet)
- [ ] `script/Deploy.s.sol` + `forge script ... --broadcast --verify`
- [ ] Confirm "Contract Source Code Verified" on Basescan
- [ ] Paste address + ABI into `frontend/src/config/contract.ts`
- [ ] Paste address + deploy block into `backend/.env.example` and tell Aditya
- [ ] Seed on-chain: create 2 orgs, donate to each with a message, run one full cycle **through proof** on one of them — so the directory shows a 'Proofed 1/1' org at demo time

### A3. Frontend chain wiring (frontend/src/config + hooks)
- [ ] `config/wagmi.ts` — baseSepolia, injected connector, http transport
- [ ] `main.tsx` — WagmiProvider + QueryClientProvider
- [x] `hooks/usePlatform.ts` — admin, orgs[], platform stats, `isAdmin`, event watchers
- [x] `hooks/useOrg.ts` — org, milestones[], `isOrgOwner`, notFound
- [x] `hooks/useCreateOrg.ts` — createOrg/updateOrg, `createdOrgId` decoded from receipt
- [x] `hooks/useDonate.ts` — donate(orgId, amount, message)
- [x] `hooks/useMilestoneActions.ts` — add / approve / release scoped to orgId
- [x] `hooks/useTxHistory.ts` — `getLogs` for all events, optional orgId filter
- [ ] **Test every hook against a real wallet** — none of the above has been exercised with MetaMask yet
- [ ] Wrong-network detection + `useSwitchChain` button

### A4. Wire hooks into Aditya's components
- [x] `ConnectButton.tsx`, `DonateForm.tsx`, `CreateOrgForm.tsx`, `ManagePanel.tsx` wired
- [ ] End-to-end on testnet: create org → donate → add (with payee) → approve → release → **try to add again (blocked) → attach proof → add works** → reload → state persists
- [ ] Two-wallet test: deployer approves, second wallet owns the org — confirm the Manage tab shows the right buttons for each

### A5. Indexer snippet for backend
- [ ] Give Aditya `backend/src/lib/viem.ts` + the `parseAbiItem` event definitions (already scaffolded — just confirm they match the final ABI)

### A6. Demo driving
- [ ] Run the live transactions during the demo; have 2 browser profiles (donor / org) ready if 2 wallets available

---

## 🟢 Aditya — UI, Backend, Docs (no Web3 knowledge required)

### B1. Frontend UI kit (frontend/src/components/ui/)
- [ ] `Button` — variants primary/secondary/danger, `loading` prop shows spinner, `disabled`
- [ ] `Card`, `Badge` (pending=amber, approved=blue, released=green), `Input`, `Spinner`, `Table`, `Toast`
- [x] `index.css` — design system (ink/leaf tokens, Bricolage/Instrument/Plex Mono), landing, receipt, rail
- [ ] Responsive QA at 400px on the landing hero + rail (stacks vertically) and org page header
- [ ] No wagmi imports anywhere in `ui/`

### B2. Frontend data components (props in, JSX out)
- [x] `StatsBar.tsx` (takes `StatTile[]`), `MilestoneTable.tsx`, `TxHistory.tsx` (donor messages, org column), `OrgCard.tsx`, `OrgList.tsx` — baseline versions exist
- [ ] Polish `OrgCard` — progress feel (raised vs released), the 'Proofed x/y' reputation line, truncation, hover
- [ ] Donor leaderboard widget on `OrgPage` (data from `api.topDonors(orgId)`, hide if backend down)
- [ ] Skeleton loaders instead of spinner text; nicer empty states
- [ ] Run everything with `VITE_USE_MOCK=true` — 3 mock orgs are in `lib/mock.ts`

### B3. Frontend utilities (frontend/src/lib/)
- [ ] `format.ts` — `formatEth(wei: bigint, decimals=4)`, `shortAddr`, `txUrl`, `addrUrl`, `formatDate(unix)`, `timeAgo`
- [ ] `types.ts` (already defined — extend if needed, tell Apurva)
- [ ] `mock.ts` — realistic sample milestones + history
- [ ] `api.ts` — typed fetch helpers for backend, each returns `null` on failure

### B4. App shell & pages
- [x] `App.tsx` shell + hash router; `HomePage`, `CreateOrgPage`, `OrgPage` — baseline versions exist
- [ ] Responsive pass at 400px for the org grid and the org header
- [ ] "Verify on Basescan" banner styling
- [ ] Footer: "All data read live from Base Sepolia · nothing is self-reported"

### B5. Backend (backend/)
- [x] Prisma schema (Org, Donation, Milestone keyed by (orgId,id), Metadata), routes, indexer, seed — baseline exists and is smoke-tested
- [ ] Run the indexer against the deployed contract once there's on-chain activity; confirm rows match Basescan
- [ ] `GET /api/orgs/:orgId/activity` — unified event feed (donations + milestone steps) so the frontend can fall back to the API when `getLogs` is slow
- [ ] Basic auth for `PUT metadata`: accept `{ signature, message }`, verify with `viem.verifyMessage` against `Org.owner`

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
