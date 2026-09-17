# Provenance — Transparent Donation Tracking (Hack2Ignite WB-05)

On-chain donation + milestone-based fund release tracker. Every donation, milestone request, approval and release is an on-chain event on **Base Sepolia**, and the dashboard reads directly from the contract so nothing shown is "claimed" — it's all verifiable on Basescan.

## Repo layout

```
Provenance/
├── docs/        # 📖 START HERE — architecture, task split, build plan, demo script
├── contracts/   # Foundry — DonationTracker.sol + tests + deploy script
├── frontend/    # Vite + React + TypeScript + wagmi/viem
└── backend/     # Express + TypeScript + Prisma (optional indexer / metadata API)
```

## Deployed contract

**Base Sepolia:** [`0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b`](https://sepolia.basescan.org/address/0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b) — full details in [`DEPLOYMENTS.md`](DEPLOYMENTS.md).

## Team

| Person | Owns |
|---|---|
| **Apurva** | Smart contract, deployment, all wallet/chain wiring in the frontend (core Web3) |
| **Aditya** | UI components & styling, backend API + Prisma, docs/demo, non-chain utilities |

See [`docs/05-TASK-SPLIT.md`](docs/05-TASK-SPLIT.md) for the exact task list.

## Quick start

```bash
# 1. Contracts
cd contracts && forge install && forge test

# 2. Frontend
cd frontend && pnpm install && cp .env.example .env && pnpm dev

# 3. Backend (optional for the demo)
cd backend && pnpm install && cp .env.example .env && pnpm prisma:push && pnpm dev
```

Full setup instructions: [`docs/08-SETUP.md`](docs/08-SETUP.md)
