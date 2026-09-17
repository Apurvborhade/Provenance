# 03 — Frontend (Vite + React + TypeScript + wagmi/viem)

**Location:** `frontend/` · **Dev:** `pnpm dev` → http://localhost:5173

## Split of ownership

| Area | Owner |
|---|---|
| `src/config/wagmi.ts`, `src/config/contract.ts` | Apurva |
| `src/hooks/*` (all chain reads/writes) | Apurva |
| `src/components/ConnectButton.tsx`, `DonateForm.tsx`, `OrgPanel.tsx` (the parts that call hooks) | Apurva |
| `src/components/ui/*` (pure presentational: Card, Badge, Button, Table, Spinner, Toast) | Aditya |
| `src/components/MilestoneTable.tsx`, `StatsBar.tsx`, `TxHistory.tsx` (take data as props, render) | Aditya |
| `src/lib/format.ts` (ETH formatting, address shortening, explorer URLs, dates) | Aditya |
| `src/pages/*` layout, `App.tsx` routing/shell, global CSS, responsive | Aditya |
| Loading / error / empty states | Aditya |

Rule: **components under `components/ui/` and the table/stats components must never import wagmi.** They receive plain props. This is what lets Aditya build and style them with mock data while Apurva wires the chain.

## Folder structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── main.tsx                 # WagmiProvider + QueryClientProvider
    ├── App.tsx                  # shell: header + tabs (Dashboard / Donate / Org)
    ├── index.css                # global styles / CSS variables
    ├── config/
    │   ├── wagmi.ts             # chains, connectors, transports
    │   └── contract.ts          # ADDRESS + ABI (paste from forge out/)
    ├── hooks/
    │   ├── useDonationTracker.ts  # reads: owner, totalDonated, balance, milestones, isOwner
    │   ├── useDonate.ts           # write: donate(value)
    │   ├── useMilestoneActions.ts # writes: add/approve/release
    │   └── useTxHistory.ts        # getLogs for all 4 events → unified list
    ├── lib/
    │   ├── format.ts            # formatEth, shortAddr, txUrl, addrUrl, formatDate
    │   ├── types.ts             # Milestone, MilestoneStatus, HistoryItem
    │   └── mock.ts              # mock data for building UI without a chain
    ├── components/
    │   ├── ui/                  # Button, Card, Badge, Table, Spinner, Toast, Input
    │   ├── ConnectButton.tsx
    │   ├── StatsBar.tsx
    │   ├── DonateForm.tsx
    │   ├── OrgPanel.tsx
    │   ├── MilestoneTable.tsx
    │   └── TxHistory.tsx
    └── pages/
        ├── DashboardPage.tsx    # public view: StatsBar + MilestoneTable + TxHistory
        ├── DonatePage.tsx       # DonateForm
        └── OrgPage.tsx          # OrgPanel (gated on isOwner)
```

## Key types (`src/lib/types.ts`)

```ts
export type MilestoneStatus = 'pending' | 'approved' | 'released';

export interface Milestone {
  id: number;
  description: string;
  amount: bigint;          // wei
  status: MilestoneStatus;
  createdAt: number;       // unix seconds
  releasedAt: number | null;
}

export interface HistoryItem {
  kind: 'donated' | 'requested' | 'approved' | 'released';
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: number;
  actor?: `0x${string}`;
  amount?: bigint;
  milestoneId?: number;
  description?: string;
}
```

## wagmi setup (`src/config/wagmi.ts`)

- Chain: `baseSepolia` from `viem/chains`
- Connector: `injected()` (MetaMask etc.). Add `walletConnect` only if time allows.
- Transport: `http(import.meta.env.VITE_RPC_URL ?? 'https://sepolia.base.org')`

## Reading data (Apurva)

```ts
useReadContract({ address, abi, functionName: 'getMilestones' })   // → Milestone[]
useReadContract({ address, abi, functionName: 'totalDonated' })
useReadContract({ address, abi, functionName: 'getBalance' })
useReadContract({ address, abi, functionName: 'owner' })
useWatchContractEvent({ address, abi, eventName: 'Donated', onLogs: refetchAll })
```

Set `query: { refetchInterval: 8000 }` as a fallback for RPCs that don't push events.

## Writing (Apurva)

```ts
const { writeContract, data: hash, isPending } = useWriteContract();
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
writeContract({ address, abi, functionName: 'donate', value: parseEther(amount) });
```

Show 3 states in the button: `Confirm in wallet…` → `Confirming…` → `Done ✓ (view on Basescan)`.

## UI states Aditya must handle (with mock data)

- Wallet not connected (Donate / Org tabs show a "Connect wallet" prompt)
- Connected but wrong chain → "Switch to Base Sepolia" button (`useSwitchChain`) — Apurva wires, Aditya styles
- Connected, not owner → Org tab shows "Only the org wallet can manage milestones" + owner address
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

`src/lib/api.ts` → `fetch(import.meta.env.VITE_API_URL + '/api/stats')`. Wrap in try/catch; if it fails, hide the extra widgets. Never block rendering on it.
