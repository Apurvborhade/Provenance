// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DonationTracker} from "../src/DonationTracker.sol";

/// @dev Usage:
///   source .env
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify -vvvv
contract Deploy is Script {
    function run() external returns (DonationTracker tracker) {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        tracker = new DonationTracker();
        vm.stopBroadcast();

        console.log("DonationTracker deployed at:", address(tracker));
        console.log("Owner:", tracker.owner());
        console.log("Deploy block:", block.number);
        console.log("-> paste address into frontend/src/config/contract.ts and backend/.env");
    }
}
