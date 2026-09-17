# Deployments

## Current: DonationPlatform v3 (multi-org + payee + proof-of-spend)

| Network | Contract | Address | Deploy block | Admin | Verified |
|---|---|---|---|---|---|
| Base Sepolia (84532) | DonationPlatform | [`0xd38Fa0f8932025b5a8F996b5DE76e0a8480D5280`](https://sepolia.basescan.org/address/0xd38Fa0f8932025b5a8F996b5DE76e0a8480D5280) | 46956091 | [`0x4ec137a8BE0466C166997BCfc56FFDafc542201B`](https://sepolia.basescan.org/address/0x4ec137a8BE0466C166997BCfc56FFDafc542201B) | ✅ [verified](https://sepolia.basescan.org/address/0xd38Fa0f8932025b5a8F996b5DE76e0a8480D5280#code) |

- Deploy tx: [`0x7b373e9f1ba8fba723a7802ecbe42424659c3dca85a7f37343545077988fbb44`](https://sepolia.basescan.org/tx/0x7b373e9f1ba8fba723a7802ecbe42424659c3dca85a7f37343545077988fbb44)
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

Then update the two files above and this table. The latest address is always in `contracts/broadcast/Deploy.s.sol/84532/run-latest.json`. `--verify` has not been taking effect from the script; verify separately:

```bash
forge verify-contract <ADDRESS> src/DonationPlatform.sol:DonationPlatform --chain base-sepolia --etherscan-api-key $ETHERSCAN_API_KEY --watch
```

## Superseded

| Contract | Address | Notes |
|---|---|---|
| DonationPlatform v2 (multi-org, no proof) | [`0x29df57C50BD4A3d4CCa3be83Bc376BDDf7353192`](https://sepolia.basescan.org/address/0x29df57C50BD4A3d4CCa3be83Bc376BDDf7353192) | 18 Sep 2026, verified. Has one real org "Hack2Ignite" + a full donate/release cycle from the UI. |
| DonationTracker v1 (single-org) | [`0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b`](https://sepolia.basescan.org/address/0x6Dba6ab5d89E854045F05C736bA52FD0Bf0AAF4b) | 17 Sep 2026, verified. |
