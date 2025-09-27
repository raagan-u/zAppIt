// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PrivateCircle} from "../src/PrivateCircle.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock verifier first
        MockVerifier verifier = new MockVerifier();
        console.log("MockVerifier deployed at:", address(verifier));

        // Deploy PrivateCircle contract
        PrivateCircle privateCircle = new PrivateCircle(address(verifier));
        console.log("PrivateCircle deployed at:", address(privateCircle));

        vm.stopBroadcast();
    }
}
