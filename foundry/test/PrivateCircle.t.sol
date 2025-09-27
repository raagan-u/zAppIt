// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PrivateCircle} from "../src/PrivateCircle.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

contract PrivateCircleTest is Test {
    PrivateCircle privateCircle;
    MockVerifier verifier;
    
    function setUp() public {
        verifier = new MockVerifier();
        privateCircle = new PrivateCircle(address(verifier));
    }

    function testPostContent() public {
        bytes memory mockProof = "mock_proof_data";
        uint256 nullifierCommitment = 12345;
        bytes32 ipfsHash = keccak256("test_content");
        
        // Should not revert
        privateCircle.postContent(mockProof, nullifierCommitment, ipfsHash);
        
        // Check that nullifier is marked as used
        assertTrue(privateCircle.isNullifierUsed(nullifierCommitment));
    }

    function testCastVote() public {
        bytes memory mockProof = "mock_proof_data";
        uint256 nullifierCommitment = 54321;
        bytes32 ipfsHash = keccak256("test_content");
        uint256 voteOption = 1; // upvote
        
        // Should not revert
        privateCircle.castVote(mockProof, nullifierCommitment, ipfsHash, voteOption);
        
        // Check that nullifier is marked as used
        assertTrue(privateCircle.isNullifierUsed(nullifierCommitment));
        
        // Check vote count
        (uint256 upvotes, uint256 downvotes) = privateCircle.getPostVotes(ipfsHash);
        assertEq(upvotes, 1);
        assertEq(downvotes, 0);
    }

    function testDoublePostPrevention() public {
        bytes memory mockProof = "mock_proof_data";
        uint256 nullifierCommitment = 11111;
        bytes32 ipfsHash = keccak256("test_content");
        
        // First post should succeed
        privateCircle.postContent(mockProof, nullifierCommitment, ipfsHash);
        
        // Second post with same nullifier should fail
        vm.expectRevert("Already used");
        privateCircle.postContent(mockProof, nullifierCommitment, ipfsHash);
    }

    function testDoubleVotePrevention() public {
        bytes memory mockProof = "mock_proof_data";
        uint256 nullifierCommitment = 22222;
        bytes32 ipfsHash = keccak256("test_content");
        uint256 voteOption = 1;
        
        // First vote should succeed
        privateCircle.castVote(mockProof, nullifierCommitment, ipfsHash, voteOption);
        
        // Second vote with same nullifier should fail
        vm.expectRevert("Already used");
        privateCircle.castVote(mockProof, nullifierCommitment, ipfsHash, voteOption);
    }
}
