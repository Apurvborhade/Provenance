// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DonationTracker} from "../src/DonationTracker.sol";

/// @dev Usage (keystore, recommended):
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account <keystore-name> --broadcast --verify -vvvv
/// Or with a raw key:
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --private-key $PRIVATE_KEY --broadcast --verify -vvvv
contract Deploy is Script {
    function run() external returns (DonationTracker tracker) {
        // Signer comes from --account / --private-key on the CLI; nothing is read from .env.
        vm.startBroadcast();
        tracker = new DonationTracker();
        vm.stopBroadcast();

        console.log("DonationTracker deployed at:", address(tracker));
        console.log("Owner:", tracker.owner());
        console.log("Deploy block:", block.number);
        console.log("-> paste address into frontend/src/config/contract.ts and backend/.env");
    }
}
