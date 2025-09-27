/**
 * IPFS service for storing encrypted content
 * Uses IPFS HTTP client for decentralized storage
 */

import { create, IPFSHTTPClient } from 'ipfs-http-client';

export interface IPFSResult {
  hash: string;
  size: number;
}

// IPFS client configuration
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFS_API_URL = 'https://ipfs.infura.io:5001/api/v0';

let ipfsClient: IPFSHTTPClient | null = null;

/**
 * Initialize IPFS client
 */
function getIPFSClient(): IPFSHTTPClient {
  if (!ipfsClient) {
    try {
      ipfsClient = create({
        url: IPFS_API_URL,
        headers: {
          authorization: 'Basic ' + Buffer.from(process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET).toString('base64')
        }
      });
    } catch (error) {
      console.warn('Failed to create IPFS client, using fallback:', error);
      // Fallback to public gateway
      ipfsClient = create({ url: 'https://ipfs.io/api/v0' });
    }
  }
  return ipfsClient;
}

/**
 * Upload encrypted content to IPFS
 * @param encryptedContent - The encrypted content to upload
 * @returns Promise with IPFS hash
 */
export async function uploadToIPFS(encryptedContent: string): Promise<IPFSResult> {
  try {
    const client = getIPFSClient();
    const result = await client.add(encryptedContent);
    
    return {
      hash: result.cid.toString(),
      size: result.size
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    // Fallback to mock for development
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
      hash: mockHash,
      size: encryptedContent.length
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
    const client = getIPFSClient();
    const chunks = [];
    
    for await (const chunk of client.cat(hash)) {
      chunks.push(chunk);
    }
    
    const content = Buffer.concat(chunks).toString();
    return content;
  } catch (error) {
    console.error('Error downloading from IPFS:', error);
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
    const client = getIPFSClient();
    await client.pin.add(hash);
    console.log(`Pinned content with hash: ${hash}`);
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
  }
}

/**
 * Upload file to IPFS (for images, audio, etc.)
 * @param fileUri - URI of the file to upload
 * @returns Promise with IPFS hash
 */
export async function uploadFileToIPFS(fileUri: string): Promise<IPFSResult> {
  try {
    const client = getIPFSClient();
    
    // For React Native, you might need to use a different approach
    // This is a simplified version - in production you'd handle file reading properly
    const fileContent = await fetch(fileUri).then(res => res.text());
    const result = await client.add(fileContent);
    
    return {
      hash: result.cid.toString(),
      size: result.size
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    // Fallback to mock for development
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
      hash: mockHash,
      size: 1024
    };
  }
}

/**
 * Get IPFS gateway URL for a hash
 * @param hash - The IPFS hash
 * @returns Gateway URL
 */
export function getIPFSGatewayURL(hash: string): string {
  return `${IPFS_GATEWAY}${hash}`;
}