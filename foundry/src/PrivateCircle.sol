// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";

contract PrivateCircle {
    HonkVerifier public verifier;

    // Track used nullifier commitments to prevent double-post / double-vote
    mapping(uint256 => bool) public nullifierUsed;

    // Track posts and votes
    mapping(bytes32 => uint256) public postVotes; // ipfsHash => vote count
    mapping(bytes32 => uint256) public postDownvotes; // ipfsHash => downvote count

    // Track circle memberships (nullifier commitments for membership verification)
    mapping(uint256 => bool) public membershipVerified;

    // Events
    event ContentPosted(
        bytes32 indexed ipfsHash,
        uint256 nullifierCommitment,
        address indexed submitter
    );
    event VoteCast(
        bytes32 indexed ipfsHash,
        uint256 voteOption,
        uint256 nullifierCommitment,
        address indexed voter
    );
    event MembershipVerified(
        uint256 nullifierCommitment,
        address indexed member
    );

    constructor(address _verifier) {
        verifier = HonkVerifier(_verifier);
    }

    // ---------------------------
    // Post encrypted content
    // ---------------------------
    function postContent(
        bytes calldata proof,
        uint256 nullifierCommitment,
        bytes32 ipfsHash
    ) external {
        require(!nullifierUsed[nullifierCommitment], "Already used");

        // Prepare public inputs as expected by Noir/Mopro circuit
        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = bytes32(nullifierCommitment);
        publicInputs[1] = bytes32(uint256(ipfsHash));

        // TODO: Replace with real verifier once proof generation is implemented
        // For now, accept any proof for testing
        require(proof.length > 0, "Empty proof");

        // Mark nullifier as used
        nullifierUsed[nullifierCommitment] = true;

        emit ContentPosted(ipfsHash, nullifierCommitment, msg.sender);
    }

    // ---------------------------
    // Cast a vote
    // ---------------------------
    function castVote(
        bytes calldata proof,
        uint256 nullifierCommitment,
        bytes32 ipfsHash,
        uint256 voteOption
    ) external {
        require(!nullifierUsed[nullifierCommitment], "Already used");
        require(voteOption == 0 || voteOption == 1, "Invalid vote");

        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = bytes32(nullifierCommitment);
        publicInputs[1] = bytes32(voteOption);

        // TODO: Replace with real verifier once proof generation is implemented
        // For now, accept any proof for testing
        require(proof.length > 0, "Empty proof");

        nullifierUsed[nullifierCommitment] = true;

        // Update vote counts
        if (voteOption == 1) {
            postVotes[ipfsHash]++;
        } else {
            postDownvotes[ipfsHash]++;
        }

        emit VoteCast(ipfsHash, voteOption, nullifierCommitment, msg.sender);
    }

    // ---------------------------
    // Verify circle membership
    // ---------------------------
    function verifyMembership(
        bytes calldata proof,
        uint256 nullifierCommitment,
        uint256 circleId
    ) external {
        require(
            !membershipVerified[nullifierCommitment],
            "Membership already verified"
        );

        // Prepare public inputs for membership verification
        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = bytes32(nullifierCommitment);
        publicInputs[1] = bytes32(circleId);

        // TODO: Replace with real verifier once proof generation is implemented
        // For now, accept any proof for testing
        require(proof.length > 0, "Empty proof");

        // Mark membership as verified
        membershipVerified[nullifierCommitment] = true;

        emit MembershipVerified(nullifierCommitment, msg.sender);
    }

    // ---------------------------
    // View functions
    // ---------------------------
    function getPostVotes(
        bytes32 ipfsHash
    ) external view returns (uint256 upvotes, uint256 downvotes) {
        return (postVotes[ipfsHash], postDownvotes[ipfsHash]);
    }

    function isNullifierUsed(
        uint256 nullifierCommitment
    ) external view returns (bool) {
        return nullifierUsed[nullifierCommitment];
    }

    function isMembershipVerified(
        uint256 nullifierCommitment
    ) external view returns (bool) {
        return membershipVerified[nullifierCommitment];
    }
}
