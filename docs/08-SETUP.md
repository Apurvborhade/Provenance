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
| Pinata JWT (receipts → IPFS) | https://app.pinata.cloud/developers/api-keys — free tier, key with `pinFileToIPFS` |

## 1. Contracts (Apurva)

```bash
cd contracts
cp .env.example .env        # fill ETHERSCAN_API_KEY (+ RPC URL if not using the public one)
forge build
forge test -vvv
```

Import the deployer key once into an encrypted Foundry keystore (never put it in `.env`):

```bash
cast wallet import deployer --interactive     # paste key, choose a password
cast wallet address --account deployer        # confirm the address; fund it from the faucet
```

Deploy + verify:

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --account deployer \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

If `--verify` fails, verify separately:

```bash
forge verify-contract <ADDRESS> src/DonationPlatform.sol:DonationPlatform \
  --chain base-sepolia --etherscan-api-key $ETHERSCAN_API_KEY --watch
```

Grab the ABI:

```bash
jq '.abi' out/DonationPlatform.sol/DonationPlatform.json
```

Paste into `frontend/src/config/contract.ts` (`DONATION_PLATFORM_ABI`) and set `DONATION_PLATFORM_ADDRESS`.

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
cp .env.example .env     # set DATABASE_URL, CONTRACT_ADDRESS, CONTRACT_DEPLOY_BLOCK, PINATA_JWT
pnpm prisma:generate
pnpm prisma:push         # applies schema to the Postgres DB in DATABASE_URL
# pnpm seed              # only against a throwaway DB — it wipes tables
pnpm dev                 # http://localhost:4000/api/health
```

## Env var reference

### `contracts/.env`
```
ETHERSCAN_API_KEY=...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# signer lives in the Foundry keystore (`cast wallet import`), not here
```

### `frontend/.env`
```
VITE_RPC_URL=https://sepolia.base.org       # or Alchemy URL
VITE_API_URL=http://localhost:4000          # optional
```

### `backend/.env`
```
PORT=4000
PINATA_JWT=                            # https://app.pinata.cloud/developers/api-keys — pins receipts to IPFS
PUBLIC_URL=http://localhost:4000      # only for local-fallback receipt URIs
DATABASE_URL="postgresql://…?sslmode=require"   # Prisma Postgres URL — get it from Apurva, never commit
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
