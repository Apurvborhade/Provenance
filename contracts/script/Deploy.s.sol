// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DonationPlatform} from "../src/DonationPlatform.sol";

/// @dev Usage (keystore, recommended):
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account <keystore-name> --broadcast --verify -vvvv
/// Or with a raw key:
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --private-key $PRIVATE_KEY --broadcast --verify -vvvv
contract Deploy is Script {
    function run() external returns (DonationPlatform platform) {
        // Signer comes from --account / --private-key on the CLI; nothing is read from .env.
        vm.startBroadcast();
        platform = new DonationPlatform();
        vm.stopBroadcast();

        console.log("DonationPlatform deployed at:", address(platform));
        console.log("Admin:", platform.admin());
        console.log("Deploy block:", block.number);
        console.log("-> paste address into frontend/src/config/contract.ts and backend/.env");
    }
}
