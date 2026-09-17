# 08 — Setup

## Prerequisites

| Tool | Install |
|---|---|
| Node ≥ 20 | https://nodejs.org or `nvm` |
| pnpm | `npm i -g pnpm` |
| Foundry | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| MetaMask | browser extension; add **Base Sepolia** network (chainId 84532, RPC `https://sepolia.base.org`, explorer `https://sepolia.basescan.org`) |
| Test ETH | https://www.alchemy.com/faucets/base-sepolia or https://portal.cdp.coinbase.com/products/faucet |
| Basescan API key (for verify) | https://basescan.org/myapikey |

## 1. Contracts (Apurva)

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit   # only once
cp .env.example .env                              # fill PRIVATE_KEY, BASESCAN_API_KEY
forge build
forge test -vvv
```

Deploy + verify:

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

If `--verify` fails, verify separately:

```bash
forge verify-contract <ADDRESS> src/DonationTracker.sol:DonationTracker \
  --chain base-sepolia --etherscan-api-key $BASESCAN_API_KEY --watch
```

Grab the ABI:

```bash
jq '.abi' out/DonationTracker.sol/DonationTracker.json
```

Paste into `frontend/src/config/contract.ts` (`DONATION_TRACKER_ABI`) and set `DONATION_TRACKER_ADDRESS`.

## 2. Frontend (both)

```bash
cd frontend
pnpm install
cp .env.example .env     # VITE_RPC_URL optional, VITE_API_URL optional
pnpm dev                 # http://localhost:5173
```

Build check: `pnpm build && pnpm preview`.

## 3. Backend (Aditya)

```bash
cd backend
pnpm install
cp .env.example .env     # set CONTRACT_ADDRESS + CONTRACT_DEPLOY_BLOCK once deployed
pnpm prisma:generate
pnpm prisma:push         # creates prisma/dev.db
pnpm seed                # optional fake data
pnpm dev                 # http://localhost:4000/api/health
```

## Env var reference

### `contracts/.env`
```
PRIVATE_KEY=0x...            # deployer; DO NOT commit
BASESCAN_API_KEY=...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### `frontend/.env`
```
VITE_RPC_URL=https://sepolia.base.org       # or Alchemy URL
VITE_API_URL=http://localhost:4000          # optional
```

### `backend/.env`
```
PORT=4000
DATABASE_URL="file:./dev.db"
RPC_URL=https://sepolia.base.org
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
CONTRACT_DEPLOY_BLOCK=0
INDEXER_POLL_MS=10000
INDEXER_ENABLED=true
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `forge: command not found` | `foundryup` then restart shell |
| MetaMask "wrong network" | Switch to Base Sepolia; the UI has a Switch button |
| Reads return `undefined` | Address in `contract.ts` wrong, or ABI stale — rebuild + repaste |
| `getLogs` rate-limited | Use Alchemy RPC; reduce block range in `useTxHistory` / indexer |
| Prisma `Unknown field` | `pnpm prisma:generate` after schema changes |
