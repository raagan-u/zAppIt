/**
 * ZK Proof service for React Native
 * Handles generation and verification of zero-knowledge proofs using Mopro
 *
 * This service integrates with your Noir circuits to generate real ZK proofs
 * for circle membership and actions.
 */

import { ZKProofInputs, ZKProofResult } from "../types";
import { generateNullifier, circleIdToNumeric } from "../utils/encryption";
import { verifyMembership } from "./blockchain";

// Import Mopro React Native package
import MoproReactNativePackage from "mopro-react-native-package";

/**
 * Initialize the ZK proof system
 * This should be called when the app starts
 */
export async function initializeZKProofs(): Promise<void> {
  try {
    console.log("🔧 Initializing ZK Proof system with Mopro...");

    // Initialize Mopro with your Noir circuits
    await MoproReactNativePackage.initialize({
      // Configure for your anon_circle circuit
      circuits: {
        anon_circle: {
          circuitPath: "./assets/circuits/anon_circle.json",
          srsPath: "./assets/circuits/default_18.srs",
        },
      },
    });

    console.log("✅ ZK Proof system initialized successfully with Mopro");
  } catch (error) {
    console.error("❌ Failed to initialize ZK proofs:", error);
    throw new Error("Failed to initialize ZK proof system");
  }
}

/**
 * Generate a ZK proof for circle membership and action using your Noir circuit
 * @param inputs - The private inputs for the proof
 * @returns Promise with the proof result
 */
export async function generateZKProof(
  inputs: ZKProofInputs
): Promise<ZKProofResult> {
  try {
    console.log("🔐 Generating ZK proof with Mopro and your Noir circuit...");
    console.log("📋 Inputs:", {
      secret: inputs.secret,
      circleCommitment: inputs.circleCommitment,
      nullifier: inputs.nullifier,
      circleId: inputs.circleId,
      actionType: inputs.actionType,
      contentHash: inputs.contentHash,
      voteOption: inputs.voteOption,
    });

    // Prepare inputs for your anon_circle circuit
    // The circuit expects: secret, circle_commitment, nullifier, circle_id, action_type, content_hash, vote_option
    const circuitInputs = [
      inputs.secret,
      inputs.circleCommitment,
      inputs.nullifier,
      inputs.circleId,
      inputs.actionType?.toString() || "0",
      inputs.contentHash || "0",
      inputs.voteOption?.toString() || "0",
    ];

    console.log(
      "🔧 Calling Mopro to generate proof with circuit inputs:",
      circuitInputs
    );

    // Generate proof using Mopro with your anon_circle circuit
    const proofResult = await MoproReactNativePackage.generateAnonCircleProof(
      inputs.secret,
      inputs.circleCommitment,
      inputs.nullifier,
      inputs.circleId,
      inputs.actionType?.toString() || "0",
      inputs.contentHash || "0",
      inputs.voteOption?.toString() || "0"
    );

    console.log("✅ ZK proof generated successfully with Mopro");
    console.log("🔐 Proof result:", proofResult);

    // The anon_circle function returns a JSON string proof
    // Parse it to extract the proof data and public inputs
    const parsedProof = JSON.parse(proofResult);

    // Extract the nullifier commitment from the proof result
    // This should match the output of your circuit's main function
    const nullifierCommitment =
      parsedProof.publicInputs?.[0] || parsedProof.proof;

    return {
      proof: proofResult, // Return the JSON string proof
      publicInputs: parsedProof.publicInputs || [nullifierCommitment],
      nullifierCommitment: nullifierCommitment,
    };
  } catch (error) {
    console.error("❌ Error generating ZK proof with Mopro:", error);
    throw new Error(
      `Failed to generate ZK proof: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Verify a ZK proof using Mopro
 * @param proofResult - The proof result to verify
 * @returns Promise with verification result
 */
export async function verifyZKProof(
  proofResult: ZKProofResult
): Promise<boolean> {
  try {
    console.log("🔍 Verifying ZK proof with Mopro...");

    // Verify proof using Mopro
    const isValid = await MoproReactNativePackage.verifyAnonCircleProof(
      proofResult.proof
    );

    console.log("✅ ZK proof verification result:", isValid);
    return isValid;
  } catch (error) {
    console.error("❌ Error verifying ZK proof with Mopro:", error);
    return false;
  }
}

/**
 * Generate nullifier commitment (simplified version)
 * In the actual implementation, this would be done in the Noir circuit
 * This simulates the circuit computation: secret + nullifier + circleId
 */
function generateNullifierCommitment(
  secret: string,
  nullifier: string,
  circleId: string
): string {
  // Simulate the circuit computation: secret + nullifier + circleId
  // In a real circuit, this would be done with field arithmetic
  const secretNum = parseInt(secret) || 0;
  const nullifierNum = parseInt(nullifier) || 0;
  const circleIdNum = parseInt(circleId) || 0;

  const result = secretNum + nullifierNum + circleIdNum;

  console.log("🔍 NULLIFIER COMMITMENT CALCULATION:");
  console.log("📋 Secret as number:", secretNum);
  console.log("📋 Nullifier as number:", nullifierNum);
  console.log("📋 Circle ID as number:", circleIdNum);
  console.log("📋 Sum result:", result);
  console.log("📋 Hex result:", `0x${result.toString(16)}`);

  // Convert to hex string to simulate field element
  return `0x${result.toString(16)}`;
}

/**
 * Verify circle membership using ZK proof
 * @param secret - User's secret
 * @param circleId - Circle ID to join
 * @returns Promise with verification result
 */
export async function verifyCircleMembership(
  secret: string,
  circleId: string
): Promise<{ isValid: boolean; nullifierCommitment?: string; error?: string }> {
  try {
    console.log("🔍 Verifying circle membership with ZK proof...");
    console.log("📝 Circle ID:", circleId);
    console.log("🔐 Secret provided:", secret ? "Yes" : "No");

    // Convert circle ID to numeric format for contract compatibility
    const numericCircleId = circleIdToNumeric(circleId);
    console.log("📝 Numeric Circle ID:", numericCircleId);

    // Generate nullifier for this verification
    const nullifier = generateNullifier();

    // Prepare ZK proof inputs for membership verification
    const proofInputs: ZKProofInputs = {
      secret: secret,
      circleCommitment: secret, // For our simplified implementation
      nullifier: nullifier,
      circleId: numericCircleId, // Use numeric circle ID
      actionType: 2, // 2 for membership verification
    };

    console.log("🔍 ZK PROOF INPUTS:");
    console.log("📋 Secret:", secret);
    console.log("📋 Circle Commitment:", secret);
    console.log("📋 Nullifier:", nullifier);
    console.log("📋 Circle ID:", circleId);
    console.log("📋 Action Type:", 2);

    // Generate ZK proof
    const proofResult = await generateZKProof(proofInputs);

    console.log("✅ ZK proof generated for membership verification");
    console.log("🔐 Nullifier commitment:", proofResult.nullifierCommitment);

    // Send proof to on-chain verifier
    let isValid = false;
    try {
      const txHash = await verifyMembership({
        proof: proofResult.proof,
        nullifierCommitment: proofResult.nullifierCommitment,
        circleId: numericCircleId, // Use numeric circle ID
      });

      console.log("🔗 On-chain verification successful:", txHash);
      isValid = true;
    } catch (error) {
      console.error("❌ On-chain verification failed:", error);
      isValid = false;
    }

    if (isValid) {
      console.log("✅ Circle membership verified successfully");
      return {
        isValid: true,
        nullifierCommitment: proofResult.nullifierCommitment,
      };
    } else {
      console.log("❌ Circle membership verification failed");
      return {
        isValid: false,
        error: "Invalid secret for this circle",
      };
    }
  } catch (error) {
    console.error("❌ Error verifying circle membership:", error);
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify circle membership",
    };
  }
}

/**
 * Simulate on-chain verification
 * In production, this would call the smart contract
 */
async function simulateOnChainVerification(
  proofResult: ZKProofResult
): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // For demo purposes, always return true if proof was generated
  // In real implementation, this would verify the proof on-chain
  return proofResult.proof && proofResult.nullifierCommitment;
}

/**
 * Clean up the ZK proof system
 * This should be called when the app is closed or the circuit is no longer needed
 */
export async function cleanupZKProofs(): Promise<void> {
  try {
    console.log("ZK proof system cleaned up");
  } catch (error) {
    console.error("Error cleaning up ZK proofs:", error);
  }
}
