# Deployments

## Current: DonationPlatform (multi-org) — ⏳ NOT YET DEPLOYED

Redeploy needed — the contract changed from `DonationTracker` to `DonationPlatform`. Run:

```bash
cd contracts && source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account provenance --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv
```

Then update `frontend/src/config/contract.ts` (`DONATION_PLATFORM_ADDRESS`, `DONATION_PLATFORM_DEPLOY_BLOCK`), `backend/.env` + `.env.example`, and the table below.

## Previous: DonationTracker (single-org, superseded)

| Network | Contract | Address | Deploy block | Owner | Verified |
|---|---|---|---|---|---|
| Base Sepolia (84532) | DonationTracker | [`0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b`](https://sepolia.basescan.org/address/0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b) | 46945949 | [`0x4ec137a8BE0466C166997BCfc56FFDafc542201B`](https://sepolia.basescan.org/address/0x4ec137a8BE0466C166997BCfc56FFDafc542201B) | ✅ [verified](https://sepolia.basescan.org/address/0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b#code) |

- Deploy tx: [`0x365b0cea4c737652766969c57c1e1edce7311587b284d29ac974359453282e4e`](https://sepolia.basescan.org/tx/0x365b0cea4c737652766969c57c1e1edce7311587b284d29ac974359453282e4e)
- Deployed: 17 Sep 2026 via `forge script script/Deploy.s.sol:Deploy --account provenance`
- Compiler: solc 0.8.24, optimizer 200 runs, evm cancun (see `contracts/foundry.toml`)

## Where the address is wired

| File | Field |
|---|---|
| `frontend/src/config/contract.ts` | `DONATION_TRACKER_ADDRESS`, `DONATION_TRACKER_DEPLOY_BLOCK` |
| `backend/.env` / `backend/.env.example` | `CONTRACT_ADDRESS`, `CONTRACT_DEPLOY_BLOCK` |

## Verify on Basescan

```bash
cd contracts
forge verify-contract <ADDRESS> src/DonationPlatform.sol:DonationPlatform \
  --chain base-sepolia --etherscan-api-key $ETHERSCAN_API_KEY --watch
```

## Redeploying

Run the deploy script again, then update the two files above and this table. The broadcast artifact with the latest address is at `contracts/broadcast/Deploy.s.sol/84532/run-latest.json`.
