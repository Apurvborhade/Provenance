# 01 — Architecture

## System diagram

```
                       ┌──────────────────────────────┐
   Anyone ───────────► │  createOrg()                 │
                       │   DonationPlatform.sol       │
   Donor wallet ─────► │   (Base Sepolia)             │
     donate(orgId,msg) │                              │
                       │   state:                     │
   Org owner ────────► │     admin                    │
     addMilestone()    │     orgs[]  (owner, balance…)│
     releaseMilestone()│     milestones[orgId][]      │
                       │     donations[orgId][donor]  │
   Platform admin ───► │                              │
     approveMilestone()│   events (all carry orgId):  │
                       │     OrgCreated / OrgUpdated  │
                       │     Donated                  │
                       │     MilestoneRequested       │
                       │     MilestoneApproved        │
                       │     MilestoneReleased        │
                       └──────────┬───────────────────┘
                                  │
               read (wagmi/viem)  │            read (viem getLogs)
            ┌─────────────────────┴─────────────────┐
            ▼                                       ▼
 ┌────────────────────────┐            ┌────────────────────────┐
 │  frontend/  (React)    │  optional  │  backend/  (Express)   │
 │  - Connect wallet      │ ◄───────── │  - Indexer: events →   │
 │  - Donate              │   REST     │    Prisma (SQLite/PG)  │
 │  - Org panel           │            │  - /api/stats          │
 │  - Public dashboard    │            │  - /api/milestones/:id │
 │  - Basescan links      │            │    /metadata (receipts)│
 └────────────────────────┘            └────────────────────────┘
```

## Core principle: chain is the source of truth

The frontend **must** work with the backend switched off. Everything a judge sees — totals, balance, milestone statuses, tx hashes — comes from:

1. **Contract reads** (`useReadContract`): `getOrgs()`, `getOrg(id)`, `getMilestones(id)`, `admin()`, `totalDonated()`, `getBalance()`
2. **Event logs** (`getLogs` / `useWatchContractEvent`): to build the transaction history table with tx hashes

The backend is a *cache + metadata layer* on top. If it's up, the frontend can optionally show richer data (donor leaderboard, receipt links). If it's down, nothing breaks.

## Data flow per action

### Create org
```
UI: name + description → writeContract('createOrg') → OrgCreated(orgId, owner, …)
→ UI decodes orgId from the receipt and navigates to #/org/:id
```

### Donate
```
UI: amount + message → writeContract('donate', [orgId, message], { value })
→ Donated(orgId, donor, amount, message, timestamp)
→ UI: refetch org + platform stats; history row with the message
```

### Add milestone (org owner)
```
writeContract('addMilestone', [orgId, description, amount]) → MilestoneRequested → Pending
```

### Approve (platform admin)
```
writeContract('approveMilestone', [orgId, milestoneId]) → MilestoneApproved → Approved
```

### Release (org owner)
```
writeContract('releaseMilestone', [orgId, milestoneId]) → ETH → payee (vendor)
→ MilestoneReleased(…, payee, …) → Released, org.balance drops, org.releasedCount++
```

### Attach proof (org owner) — the one flow that needs the backend
```
UI: pick receipt file → keccak256 in browser
→ POST /api/.../receipt → backend hashes again, stores uploads/<hash><ext>, returns { hash, uri }
→ UI checks server hash == local hash (else abort)
→ writeContract('attachProof', [orgId, milestoneId, hash, uri]) → ProofAttached → org.proofCount++
Until this happens, addMilestone reverts ProofRequired(milestoneId) for that org.
```

## Why this shape

| Decision | Reason |
|---|---|
| One contract, many orgs (not a factory) | One address to verify/index; org creation is one cheap tx; cross-org isolation enforced by per-org balances |
| Admin approves, org releases | Separation of duties — org can't approve its own spend, admin can't withdraw |
| Release pays the payee, not the org | Money never sits in the org wallet; the approved destination is the actual destination |
| Proof gates the next request | Cheapest possible "show evidence" lever; O(1) via releasedCount/proofCount counters |
| Hash + URI on-chain, file on the backend | Chain stores a 32-byte commitment; the backend stores the bytes content-addressed by that hash. Swap for IPFS later without touching the contract |
| Frontend reads chain directly | Removes indexer/sync bugs as a demo risk |
| Events for every state change | Cheap, indexable, and give tx hashes for the audit trail |
| `getMilestones()` returns full array | One RPC call for the whole table |
| Backend is optional | Gives Aditya a meaty non-Web3 lane without putting it on the demo critical path |
| Base Sepolia | Fast finality, cheap, good explorer, easy faucet |

## Environments

| Thing | Value |
|---|---|
| Chain | Base Sepolia, chainId `84532` |
| RPC | `https://sepolia.base.org` (public) — or Alchemy/Infura key for reliability |
| Explorer | `https://sepolia.basescan.org` |
| Faucet | https://www.alchemy.com/faucets/base-sepolia or Coinbase faucet |

## Contract address hand-off

After Apurva deploys, the address + ABI go in **exactly two places**:

- `frontend/src/config/contract.ts` → `DONATION_PLATFORM_ADDRESS`, `DONATION_PLATFORM_DEPLOY_BLOCK`, `DONATION_PLATFORM_ABI`
- `backend/.env` → `CONTRACT_ADDRESS`

ABI is generated by `forge build` at `contracts/out/DonationPlatform.sol/DonationPlatform.json` → copy the `abi` array.
