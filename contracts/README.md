# contracts/ — DonationTracker (Foundry)

Owner: **Apurva**. Spec: [`../docs/02-SMART-CONTRACT.md`](../docs/02-SMART-CONTRACT.md)

```bash
forge install foundry-rs/forge-std --no-commit   # first time only
forge build
forge test -vvv
forge fmt

# deploy + verify — signer from a Foundry keystore (cast wallet import <name> --interactive)
cp .env.example .env   # set ETHERSCAN_API_KEY + BASE_SEPOLIA_RPC_URL
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account <name> --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv

# ABI for the frontend
jq '.abi' out/DonationTracker.sol/DonationTracker.json
```
