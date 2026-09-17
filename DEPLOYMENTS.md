# Deployments

## ⏳ Redeploy pending — contract changed (payee, attachProof, ProofRequired)

The address below is the multi-org contract **without** proof-of-spend. Frontend and backend are wired to it until you redeploy:

```bash
cd contracts && source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account provenance --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv
```

## Current: DonationPlatform (multi-org, v2 — no proof yet)

| Network | Contract | Address | Deploy block | Admin | Verified |
|---|---|---|---|---|---|
| Base Sepolia (84532) | DonationPlatform | [`0x29df57C50BD4A3d4CCa3be83Bc376BDDf7353192`](https://sepolia.basescan.org/address/0x29df57C50BD4A3d4CCa3be83Bc376BDDf7353192) | 46955584 | [`0x4ec137a8BE0466C166997BCfc56FFDafc542201B`](https://sepolia.basescan.org/address/0x4ec137a8BE0466C166997BCfc56FFDafc542201B) | ✅ [verified](https://sepolia.basescan.org/address/0x29df57C50BD4A3d4CCa3be83Bc376BDDf7353192#code) |

- Deploy tx: [`0x78759cd2d9da334e4c34c7c000b27782e1f3557d8efe40ce06087a1ffe767dc7`](https://sepolia.basescan.org/tx/0x78759cd2d9da334e4c34c7c000b27782e1f3557d8efe40ce06087a1ffe767dc7)
- Deployed: 18 Sep 2026 via `forge script script/Deploy.s.sol:Deploy --account provenance`
- Compiler: solc 0.8.24, optimizer 200 runs, evm cancun (see `contracts/foundry.toml`)
- Admin = deployer = the `provenance` keystore. It approves milestones for every org.

## Where the address is wired

| File | Field |
|---|---|
| `frontend/src/config/contract.ts` | `DONATION_PLATFORM_ADDRESS`, `DONATION_PLATFORM_DEPLOY_BLOCK` |
| `backend/.env` / `backend/.env.example` | `CONTRACT_ADDRESS`, `CONTRACT_DEPLOY_BLOCK` |

## Redeploying

```bash
cd contracts && source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account provenance --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv
```

Then update the two files above and this table. The latest address is always in `contracts/broadcast/Deploy.s.sol/84532/run-latest.json`. If `--verify` didn't run:

```bash
forge verify-contract <ADDRESS> src/DonationPlatform.sol:DonationPlatform --chain base-sepolia --etherscan-api-key $ETHERSCAN_API_KEY --watch
```

## Superseded

| Network | Contract | Address | Notes |
|---|---|---|---|
| Base Sepolia | DonationTracker (single-org) | [`0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b`](https://sepolia.basescan.org/address/0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b) | v1, deployed 17 Sep 2026, verified. No longer used. |
