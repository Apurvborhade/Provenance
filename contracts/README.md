# contracts/ — DonationTracker (Foundry)

Owner: **Apurva**. Spec: [`../docs/02-SMART-CONTRACT.md`](../docs/02-SMART-CONTRACT.md)

```bash
forge install foundry-rs/forge-std --no-commit   # first time only
forge build
forge test -vvv
forge fmt

# deploy + verify (fill .env first)
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY -vvvv

# ABI for the frontend
jq '.abi' out/DonationTracker.sol/DonationTracker.json
```
