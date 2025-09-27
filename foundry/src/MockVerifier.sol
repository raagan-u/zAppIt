// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Mock verifier for testing purposes
 * In production, this would be replaced with the actual Mopro verifier
 */
contract MockVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external pure returns (bool) {
        // Mock verification - always returns true for testing
        // In production, this would perform actual zk proof verification
        require(proof.length > 0, "Empty proof");
        require(publicInputs.length > 0, "Empty public inputs");
        
        // For hackathon demo, we'll accept any proof with valid format
        return true;
    }
}
