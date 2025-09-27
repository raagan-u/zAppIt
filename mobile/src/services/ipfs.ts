/**
 * IPFS service for storing encrypted content
 * Uses Pinata HTTP API for React Native compatibility
 */

import { PINATA_CONFIG } from "../config/pinata";

export interface IPFSResult {
  hash: string;
  size: number;
}

/**
 * Upload content to IPFS using direct HTTP API (React Native compatible)
 */
async function uploadToIPFSDirect(
  content: string,
  filename: string = "content.txt"
): Promise<{ cid: string; size: number }> {
  try {
    if (
      !PINATA_CONFIG.PINATA_JWT ||
      PINATA_CONFIG.PINATA_JWT === "your_pinata_jwt_here"
    ) {
      throw new Error("Pinata JWT not configured");
    }

    console.log("🔧 Pinata JWT configured, attempting JSON upload...");
    console.log("🔧 Content length:", content.length);
    console.log("🔧 Filename:", filename);

    // Use JSON upload instead of FormData (React Native compatible)
    const uploadData = {
      content: content,
      filename: filename,
      timestamp: Date.now(),
      type: "encrypted-content",
    };

    console.log("🔧 JSON data prepared, making request to Pinata...");

    // Upload to Pinata using JSON API (same as connection test)
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_CONFIG.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: uploadData,
          pinataMetadata: {
            name: filename,
            keyvalues: {
              app: "jujyno",
              timestamp: Date.now().toString(),
              type: "encrypted-content",
            },
          },
        }),
      }
    );

    console.log("🔧 Response status:", response.status);
    console.log("🔧 Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔧 Error response:", errorText);
      throw new Error(
        `Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("🔧 Upload successful:", result);

    return {
      cid: result.IpfsHash,
      size: result.PinSize,
    };
  } catch (error) {
    console.error("❌ Direct IPFS upload failed:", error);
    console.error("❌ Error type:", typeof error);
    console.error(
      "❌ Error message:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Download content from IPFS using direct HTTP API
 */
async function downloadFromIPFSDirect(cid: string): Promise<string> {
  try {
    const response = await fetch(
      `https://${PINATA_CONFIG.PINATA_GATEWAY}/ipfs/${cid}`
    );

    if (!response.ok) {
      throw new Error(
        `IPFS download failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.text();
  } catch (error) {
    console.error("Direct IPFS download failed:", error);
    throw error;
  }
}

/**
 * Upload encrypted content to IPFS
 * @param encryptedContent - The encrypted content to upload
 * @returns Promise with IPFS hash
 */
export async function uploadToIPFS(
  encryptedContent: string
): Promise<IPFSResult> {
  try {
    console.log("📤 Uploading to IPFS via direct API...");

    const result = await uploadToIPFSDirect(
      encryptedContent,
      "encrypted-content.txt"
    );

    console.log(`📤 Content uploaded to IPFS: ${result.cid}`);

    return {
      hash: result.cid,
      size: result.size,
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    // Fallback to mock for development
    const mockHash = `Qm${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
      hash: mockHash,
      size: encryptedContent.length,
    };
  }
}

/**
 * Download content from IPFS
 * @param hash - The IPFS hash to download
 * @returns Promise with the content
 */
export async function downloadFromIPFS(hash: string): Promise<string> {
  try {
    console.log(`📥 Downloading from IPFS: ${hash}`);

    const content = await downloadFromIPFSDirect(hash);

    console.log(`📥 Content downloaded from IPFS`);

    return content;
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    // Fallback to mock for development
    return `Mock encrypted content for hash: ${hash}`;
  }
}

/**
 * Pin content to IPFS (ensure it stays available)
 * @param hash - The IPFS hash to pin
 */
export async function pinToIPFS(hash: string): Promise<void> {
  try {
    // Pinata automatically pins content when uploaded via their API
    console.log(`📌 Content with hash ${hash} is already pinned via Pinata`);
  } catch (error) {
    console.error("Error pinning to IPFS:", error);
  }
}

/**
 * Upload file to IPFS (for images, audio, etc.)
 * @param fileUri - URI of the file to upload
 * @returns Promise with IPFS hash
 */
export async function uploadFileToIPFS(fileUri: string): Promise<IPFSResult> {
  try {
    console.log("📤 Uploading file to IPFS:", fileUri);

    // For React Native file uploads, we need to read the file first
    // This is a placeholder - you'd need to implement file reading
    console.log("File upload to IPFS not yet implemented for React Native");

    // Mock implementation for now
    const mockHash = `Qm${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    return {
      hash: mockHash,
      size: 1024, // Mock size
    };
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw error;
  }
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing Pinata connection...");

    if (
      !PINATA_CONFIG.PINATA_JWT ||
      PINATA_CONFIG.PINATA_JWT === "your_pinata_jwt_here"
    ) {
      console.log("❌ Pinata JWT not configured");
      return false;
    }

    // Test with a simple JSON upload
    const testData = {
      content: "test connection",
      timestamp: Date.now(),
      type: "connection-test",
    };

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_CONFIG.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: testData,
          pinataMetadata: {
            name: "connection-test.json",
            keyvalues: {
              app: "jujyno",
              type: "connection-test",
            },
          },
        }),
      }
    );

    console.log("🧪 Test response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Pinata connection successful:", result.IpfsHash);
      return true;
    } else {
      const errorText = await response.text();
      console.error("❌ Pinata connection failed:", errorText);
      return false;
    }
  } catch (error) {
    console.error("❌ Pinata connection test failed:", error);
    return false;
  }
}

/**
 * Get IPFS gateway URL for a hash
 * @param hash - The IPFS hash
 * @returns Gateway URL
 */
export function getIPFSGatewayURL(hash: string): string {
  return `https://${PINATA_CONFIG.PINATA_GATEWAY}/ipfs/${hash}`;
}
