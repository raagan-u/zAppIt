/**
 * Blockchain service for interacting with the PrivateCircle smart contract
 * Handles proof verification and nullifier tracking
 */

import { ethers } from "ethers";
import { ZKProofResult } from "../types";

export interface ContractConfig {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
}

export interface PostContentParams {
  proof: any;
  nullifierCommitment: string;
  ipfsHash: string;
}

export interface VoteParams {
  proof: any;
  nullifierCommitment: string;
  voteOption: number;
}

export interface MembershipVerificationParams {
  proof: any;
  nullifierCommitment: string;
  circleId: string;
}

import contractConfig from "../config/contract.json";

// PrivateCircle contract ABI (minimal for our functions)
const PRIVATE_CIRCLE_ABI = [
  "function verifyMembership(bytes calldata proof, uint256 nullifierCommitment, uint256 circleId) external",
  "function postContent(bytes calldata proof, uint256 nullifierCommitment, bytes32 ipfsHash) external",
  "function castVote(bytes calldata proof, uint256 nullifierCommitment, bytes32 ipfsHash, uint256 voteOption) external",
  "function nullifierUsed(uint256) external view returns (bool)",
  "function membershipVerified(uint256) external view returns (bool)",
  "event ContentPosted(bytes32 indexed ipfsHash, uint256 nullifierCommitment, address indexed author)",
  "event VoteCast(bytes32 indexed ipfsHash, uint256 voteOption, uint256 nullifierCommitment, address indexed voter)",
  "event MembershipVerified(uint256 nullifierCommitment, address indexed member)",
];

/**
 * Contract configuration loaded from config file
 */
export const DEFAULT_CONFIG: ContractConfig = {
  contractAddress: contractConfig.contractAddress,
  rpcUrl: contractConfig.rpcUrl,
  chainId: contractConfig.chainId,
};

/**
 * Get provider and contract instance
 */
function getContract(config: ContractConfig = DEFAULT_CONFIG) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  // Create a wallet with a default private key for local testing
  // In production, this should come from user's wallet
  const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Anvil default private key
    provider
  );

  const contract = new ethers.Contract(
    config.contractAddress,
    PRIVATE_CIRCLE_ABI,
    wallet
  );
  return { provider, contract, wallet };
}

/**
 * Post encrypted content to the blockchain
 * @param params - Post parameters including proof and content hash
 * @param config - Contract configuration
 * @returns Promise with transaction hash
 */
export async function postContent(
  params: PostContentParams,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<string> {
  try {
    // TODO: Implement actual blockchain interaction
    // This would use ethers.js or web3.js to interact with the contract

    console.log("Posting content to blockchain:", {
      nullifierCommitment: params.nullifierCommitment,
      ipfsHash: params.ipfsHash,
      contractAddress: config.contractAddress,
    });

    // Mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    return mockTxHash;
  } catch (error) {
    console.error("Error posting content to blockchain:", error);
    throw new Error("Failed to post content to blockchain");
  }
}

/**
 * Cast a vote on the blockchain
 * @param params - Vote parameters including proof and vote option
 * @param config - Contract configuration
 * @returns Promise with transaction hash
 */
export async function castVote(
  params: VoteParams,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<string> {
  try {
    // TODO: Implement actual blockchain interaction

    console.log("Casting vote on blockchain:", {
      nullifierCommitment: params.nullifierCommitment,
      voteOption: params.voteOption,
      contractAddress: config.contractAddress,
    });

    // Mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    return mockTxHash;
  } catch (error) {
    console.error("Error casting vote on blockchain:", error);
    throw new Error("Failed to cast vote on blockchain");
  }
}

/**
 * Check if a nullifier has been used
 * @param nullifierCommitment - The nullifier commitment to check
 * @param config - Contract configuration
 * @returns Promise with boolean indicating if nullifier is used
 */
export async function isNullifierUsed(
  nullifierCommitment: string,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<boolean> {
  try {
    // TODO: Implement actual contract call to check nullifier
    // This would call the nullifierUsed mapping on the contract

    console.log("Checking nullifier usage:", nullifierCommitment);

    // Mock response
    return false;
  } catch (error) {
    console.error("Error checking nullifier usage:", error);
    return false;
  }
}

/**
 * Verify circle membership on-chain
 * @param params - Membership verification parameters
 * @param config - Contract configuration
 * @returns Promise with transaction hash
 */
export async function verifyMembership(
  params: MembershipVerificationParams,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<string> {
  try {
    console.log("Verifying membership on blockchain:", {
      nullifierCommitment: params.nullifierCommitment,
      circleId: params.circleId,
      contractAddress: config.contractAddress,
    });

    const { contract, wallet } = getContract(config);

    // Convert proof to bytes (handle different proof formats)
    let proofBytes: Uint8Array;
    try {
      // Try to convert as hex string first
      proofBytes = ethers.getBytes(params.proof);
    } catch (error) {
      // If that fails, treat as string and convert to bytes
      console.log("⚠️ Proof conversion failed, treating as string:", error);
      proofBytes = new TextEncoder().encode(params.proof);
    }

    // Log exact data being sent to contract
    console.log("🔍 DETAILED CONTRACT CALL LOGS:");
    console.log("📋 Contract Address:", config.contractAddress);
    console.log("📋 Function: verifyMembership");
    console.log("📋 Proof (raw):", params.proof);
    console.log("📋 Proof (as bytes):", proofBytes);
    console.log("📋 Proof (hex):", ethers.hexlify(proofBytes));
    console.log("📋 Nullifier Commitment (raw):", params.nullifierCommitment);
    console.log(
      "📋 Nullifier Commitment (as BigInt):",
      BigInt(params.nullifierCommitment)
    );
    console.log("📋 Circle ID (raw):", params.circleId);
    console.log("📋 Circle ID (as BigInt):", BigInt(params.circleId));
    console.log("📋 RPC URL:", config.rpcUrl);
    console.log("📋 Chain ID:", config.chainId);
    console.log("📋 Wallet Address:", wallet.address);
    console.log("📋 Contract ABI:", PRIVATE_CIRCLE_ABI);

    // Call the contract function
    const tx = await contract.verifyMembership(
      proofBytes,
      BigInt(params.nullifierCommitment),
      BigInt(params.circleId)
    );

    console.log("✅ Membership verification transaction sent:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error verifying membership on blockchain:", error);
    throw new Error(
      `Failed to verify membership on blockchain: ${error.message}`
    );
  }
}

/**
 * Check if membership is verified
 * @param nullifierCommitment - The nullifier commitment to check
 * @param config - Contract configuration
 * @returns Promise with boolean indicating if membership is verified
 */
export async function isMembershipVerified(
  nullifierCommitment: string,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<boolean> {
  try {
    console.log("Checking membership verification:", nullifierCommitment);

    const { contract } = getContract(config);

    // Call the contract function
    const isVerified = await contract.membershipVerified(
      BigInt(nullifierCommitment)
    );

    console.log("Membership verification result:", isVerified);
    return isVerified;
  } catch (error) {
    console.error("Error checking membership verification:", error);
    return false;
  }
}

/**
 * Get contract events (posts and votes)
 * @param fromBlock - Starting block number
 * @param config - Contract configuration
 * @returns Promise with events
 */
export async function getContractEvents(
  fromBlock: number = 0,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<any[]> {
  try {
    // TODO: Implement actual event fetching
    // This would fetch ContentPosted and VoteCast events

    console.log("Fetching contract events from block:", fromBlock);

    // Mock events
    return [];
  } catch (error) {
    console.error("Error fetching contract events:", error);
    return [];
  }
}
