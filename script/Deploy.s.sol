// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {Romulus} from "../src/Romulus.sol";

/**
 * @title Deploy
 * @notice Deployment script for Romulus randomness oracle
 * @dev Use with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Romulus Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Romulus contract
        Romulus romulus = new Romulus();

        vm.stopBroadcast();

        // Verify deployment
        console.log("\n=== Deployment Results ===");
        console.log("Romulus deployed at:", address(romulus));
        console.log("Owner:", romulus.owner());
        console.log("Request counter:", romulus.requestCounter());
        console.log("Current ring position:", romulus.currentRingPosition());

        // Test basic functionality
        console.log("\n=== Testing Basic Functionality ===");

        // Test ring status
        (uint256 validSeeds, uint256 oldestAge, uint256 nextRefresh) = romulus
            .getRingStatus();
        console.log("Valid seeds:", validSeeds);
        console.log("Oldest seed age:", oldestAge, "blocks");
        console.log("Next refresh in:", nextRefresh, "blocks");

        // Test entropy stats
        (
            uint256 contributions,
            uint256 lastBlock,
            uint256 blocksSince
        ) = romulus.getEntropyStats();
        console.log("Entropy contributions:", contributions);
        console.log("Last entropy block:", lastBlock);
        console.log("Blocks since last entropy:", blocksSince);

        // Test instant randomness
        uint256 random1 = romulus.getInstantRandom("test1");
        uint256 random2 = romulus.getInstantRandom("test2");
        console.log("Random 1:", random1);
        console.log("Random 2:", random2);
        console.log("Randomness working:", random1 != random2 ? "YES" : "NO");

        // Verify constants
        console.log("\n=== Contract Constants ===");
        console.log("MIN_DELAY:", romulus.MIN_DELAY());
        console.log("MAX_HASH_COUNT:", romulus.MAX_HASH_COUNT());
        console.log("RING_SIZE:", romulus.RING_SIZE());
        console.log("SEED_REFRESH_INTERVAL:", romulus.SEED_REFRESH_INTERVAL());
        console.log("HASHES_PER_SEED:", romulus.HASHES_PER_SEED());

        console.log("\n=== Deployment Complete ===");
        console.log("Contract ready for use!");

        // Output useful commands
        console.log("\n=== Useful Commands ===");
        console.log("Test instant random:");
        console.log(
            "cast call",
            vm.toString(address(romulus)),
            '"getInstantRandom(bytes)" "0x74657374"'
        );
        console.log("Check ring status:");
        console.log(
            "cast call",
            vm.toString(address(romulus)),
            '"getRingStatus()"'
        );
        console.log("Check entropy stats:");
        console.log(
            "cast call",
            vm.toString(address(romulus)),
            '"getEntropyStats()"'
        );
    }
}
