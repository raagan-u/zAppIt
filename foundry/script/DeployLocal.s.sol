// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PrivateCircle} from "../src/PrivateCircle.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

contract DeployLocalScript is Script {
    function run() public {
        // Use the first account from Anvil (no private key needed)
        vm.startBroadcast();

        console.log("Deploying to local network...");
        console.log("Deployer address:", msg.sender);

        // Deploy mock verifier first
        MockVerifier verifier = new MockVerifier();
        console.log("MockVerifier deployed at:", address(verifier));

        // Deploy PrivateCircle contract
        PrivateCircle privateCircle = new PrivateCircle(address(verifier));
        console.log("PrivateCircle deployed at:", address(privateCircle));

        console.log("Deployment completed successfully!");
        console.log("Contract addresses:");
        console.log("- MockVerifier:", address(verifier));
        console.log("- PrivateCircle:", address(privateCircle));

        vm.stopBroadcast();
    }
}
