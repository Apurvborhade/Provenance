# 03 — Frontend (Vite + React + TypeScript + wagmi/viem)

**Location:** `frontend/` · **Dev:** `pnpm dev` → http://localhost:5173

## Split of ownership

| Area | Owner |
|---|---|
| `src/config/wagmi.ts`, `src/config/contract.ts` | Apurva |
| `src/hooks/*` (all chain reads/writes) | Apurva |
| `src/components/ConnectButton.tsx`, `DonateForm.tsx`, `CreateOrgForm.tsx`, `ManagePanel.tsx` (the parts that call hooks) | Apurva |
| `src/components/ui/*` (pure presentational: Card, Badge, Button, Table, Spinner, Toast) | Aditya |
| `src/components/MilestoneTable.tsx`, `StatsBar.tsx`, `TxHistory.tsx`, `OrgCard.tsx`, `OrgList.tsx` (take data as props, render) | Aditya |
| `src/lib/format.ts` (ETH formatting, address shortening, explorer URLs, dates) | Aditya |
| `src/pages/*` layout, `App.tsx` shell, `lib/router.ts`, global CSS, responsive | Aditya |
| Loading / error / empty states | Aditya |

Rule: **components under `components/ui/` and the table/stats components must never import wagmi.** They receive plain props. This is what lets Aditya build and style them with mock data while Apurva wires the chain.

## Routes (hash router, `src/lib/router.ts`)

| Hash | Page | Shows |
|---|---|---|
| `#/` | `HomePage` | Platform stats, org directory (cards), platform-wide activity |
| `#/create` | `CreateOrgPage` | Create-org form; redirects to the new org on success |
| `#/org/:id` | `OrgPage` | Org header + stats, tabs: **Overview** (milestones, history) · **Donate** · **Manage** (role-aware) |

## Folder structure

```
frontend/src/
├── main.tsx                    # WagmiProvider + QueryClientProvider
├── App.tsx                     # shell + route switch
├── index.css
├── config/
│   ├── wagmi.ts                # chains, connectors, transports
│   └── contract.ts             # DONATION_PLATFORM_ADDRESS / DEPLOY_BLOCK / ABI
├── hooks/
│   ├── contract.ts             # shared { address, abi, chainId }
│   ├── usePlatform.ts          # admin, orgs[], platform stats, isAdmin, event watchers
│   ├── useOrg.ts               # org, milestones[], isOrgOwner, notFound
│   ├── useCreateOrg.ts         # createOrg / updateOrg; createdOrgId from receipt
│   ├── useDonate.ts            # donate(orgId, amount, message)
│   ├── useMilestoneActions.ts  # add / approve / release scoped to orgId
│   ├── useTxHistory.ts         # getLogs → HistoryItem[], optional orgId filter
│   └── useNetworkGuard.ts
├── lib/
│   ├── types.ts                # Org, Milestone, HistoryItem, PlatformStats, TxState
│   ├── router.ts               # useRoute, href, navigate
│   ├── format.ts, mock.ts, api.ts
├── components/
│   ├── ui/                     # Button, Card, Badge, Input, Banner, Spinner, TxStatus
│   ├── ConnectButton.tsx
│   ├── OrgCard.tsx, OrgList.tsx
│   ├── StatsBar.tsx            # takes StatTile[]; helpers ethTile() / numTile()
│   ├── MilestoneTable.tsx, TxHistory.tsx
│   ├── CreateOrgForm.tsx, DonateForm.tsx, ManagePanel.tsx, AttachProofForm.tsx
└── pages/
    ├── HomePage.tsx, CreateOrgPage.tsx, OrgPage.tsx
```

## Key types (`src/lib/types.ts`)

`Org` (id, owner, name, description, totalDonated, totalReleased, balance, donorCount, createdAt) · `Milestone` (id, orgId, description, amount, status, createdAt, releasedAt) · `HistoryItem` (kind: orgCreated|donated|requested|approved|released, orgId, txHash, …, message) · `PlatformStats` · `TxState`.

## wagmi setup (`src/config/wagmi.ts`)

- Chain: `baseSepolia` from `viem/chains`
- Connector: `injected()` (MetaMask etc.). Add `walletConnect` only if time allows.
- Transport: `http(import.meta.env.VITE_RPC_URL ?? 'https://sepolia.base.org')`

## Reading data (Apurva)

```ts
useReadContract({ ...platformContract, functionName: 'getOrgs' })                    // → Org[]
useReadContract({ ...platformContract, functionName: 'getOrg', args: [orgId] })
useReadContract({ ...platformContract, functionName: 'getMilestones', args: [orgId] })
useReadContract({ ...platformContract, functionName: 'admin' })
useWatchContractEvent({ ...platformContract, eventName: 'Donated', onLogs: refetchAll })
```

Set `query: { refetchInterval: 8000 }` as a fallback for RPCs that don't push events.

## Writing (Apurva)

```ts
const { writeContract, data: hash, isPending } = useWriteContract();
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
writeContract({ ...platformContract, functionName: 'donate', args: [orgId, message], value: parseEther(amount) });
```

Show 3 states in the button: `Confirm in wallet…` → `Confirming…` → `Done ✓ (view on Basescan)`.

## UI states Aditya must handle (with mock data)

- Wallet not connected (Donate / Org tabs show a "Connect wallet" prompt)
- Connected but wrong chain → "Switch to Base Sepolia" button (`useSwitchChain`) — Apurva wires, Aditya styles
- Connected, neither org owner nor admin → Manage tab shows who can do what (owner + admin addresses)
- Org owner sees "Request a release" form (with payee field) + Release / Attach proof buttons; admin sees Approve buttons; a wallet that is both sees everything
- Org owner with an unproofed release → warn banner, request form disabled, "Attach proof" button on the row
- Public org page with unproofed releases → info banner "cannot request more until proof is attached"
- Proof column: ✓ receipt link (hover = hash) / "awaiting proof" / —
- Org not found (`#/org/999`) → error banner with link home
- Empty org directory → "No organisations yet. Be the first to create one."
- Empty milestones table → "No milestones yet"
- Milestone with `amount > balance` → Release button disabled + tooltip "Insufficient balance"
- Tx pending / error toast

## Explorer links (`src/lib/format.ts`)

```ts
export const EXPLORER = 'https://sepolia.basescan.org';
export const txUrl   = (h: string) => `${EXPLORER}/tx/${h}`;
export const addrUrl = (a: string) => `${EXPLORER}/address/${a}`;
```

## Optional backend integration (only if backend is running)

`src/lib/api.ts` → `api.orgStats(orgId)`, `api.topDonors(orgId)`, `api.milestoneMetadata(orgId, id)`, and `uploadReceipt(orgId, id, file)`.

**Exception to "must work without the backend":** attaching proof needs the backend running, because the receipt has to be stored somewhere the on-chain URI can point to. `AttachProofForm` says so if `VITE_API_URL` is unset. Everything else on the page still works.

### Proof-of-spend flow (`AttachProofForm`)
1. User picks a file (pdf/png/jpg/webp/heic/txt ≤ 10 MB). No URL, no hash typed by anyone.
2. Browser computes `keccak256(bytes)`.
3. File is POSTed to `/api/orgs/:orgId/milestones/:id/receipt`; server computes its own keccak256, stores as `uploads/<hash><ext>`, returns `{ hash, uri }`.
4. Frontend **refuses to proceed if the two hashes differ** — the server can't swap the file.
5. `attachProof(orgId, id, hash, uri)` goes on-chain.
Anyone can later download `uri`, hash it, and compare with the on-chain `proofHash`. Wrap in try/catch; if it fails, hide the extra widgets. Never block rendering on it.
