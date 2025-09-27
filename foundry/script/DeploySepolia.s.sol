// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PrivateCircle} from "../src/PrivateCircle.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

contract DeploySepoliaScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying to Sepolia testnet...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

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
