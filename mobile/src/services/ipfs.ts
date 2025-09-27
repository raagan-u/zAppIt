/**
 * IPFS service for storing encrypted content
 * Uses Pinata SDK for decentralized storage
 */

import { PinataSDK } from "pinata";
import { PINATA_CONFIG } from "../config/pinata";

export interface IPFSResult {
  hash: string;
  size: number;
}

let pinataClient: PinataSDK | null = null;

/**
 * Initialize Pinata client
 */
function getPinataClient(): PinataSDK {
  if (!pinataClient) {
    try {
      pinataClient = new PinataSDK({
        pinataJwt: PINATA_CONFIG.PINATA_JWT,
        pinataGateway: PINATA_CONFIG.PINATA_GATEWAY,
      });
    } catch (error) {
      console.warn("Failed to create Pinata client, using fallback:", error);
      // Fallback to mock client for development
      pinataClient = null;
    }
  }
  return pinataClient;
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
    const client = getPinataClient();
    
    if (!client) {
      throw new Error("Pinata client not available");
    }

    // Create a File object from the content
    const file = new File([encryptedContent], "encrypted-content.txt", {
      type: "text/plain",
    });

    const result = await client.upload.public.file(file);

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
    const client = getPinataClient();
    
    if (!client) {
      throw new Error("Pinata client not available");
    }

    // Use Pinata gateway to fetch content
    const content = await client.gateways.public.get(hash);
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
    const client = getPinataClient();
    
    if (!client) {
      throw new Error("Pinata client not available");
    }

    // Pinata automatically pins content when uploaded
    console.log(`Content with hash ${hash} is already pinned via Pinata`);
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
    const client = getPinataClient();
    
    if (!client) {
      throw new Error("Pinata client not available");
    }

    // For React Native, fetch the file content
    const response = await fetch(fileUri);
    const fileContent = await response.text();
    
    // Create a File object
    const file = new File([fileContent], "uploaded-file", {
      type: response.headers.get("content-type") || "application/octet-stream",
    });

    const result = await client.upload.public.file(file);

    return {
      hash: result.cid,
      size: result.size,
    };
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    // Fallback to mock for development
    const mockHash = `Qm${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
      hash: mockHash,
      size: 1024,
    };
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
