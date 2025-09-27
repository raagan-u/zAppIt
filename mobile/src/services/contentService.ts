/**
 * Content service that orchestrates the full flow:
 * 1. Encrypt content with circle key
 * 2. Upload to IPFS
 * 3. Generate ZK proof
 * 4. Submit to blockchain
 */

import { CircleKey, Post, ZKProofInputs, EncryptedContent } from '../types';
import { deriveCircleKey, encryptContent, generateNullifier } from '../utils/encryption';
import { uploadToIPFS, downloadFromIPFS, pinToIPFS } from './ipfs';
import { generateZKProof } from './zkProofs';
import { postContent, castVote } from './blockchain';

export interface PostContentParams {
  content: string;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'file';
  circleId: string;
  userSecret: string;
}

export interface VoteParams {
  postId: string;
  ipfsHash: string;
  voteType: 'upvote' | 'downvote';
  circleId: string;
  userSecret: string;
}

/**
 * Post content to a circle
 * @param params - Post parameters
 * @returns Promise with post result
 */
export async function postContentToCircle(params: PostContentParams): Promise<Post> {
  try {
    // 1. Derive circle key
    const circleKey = deriveCircleKey(params.userSecret, params.circleId);
    
    // 2. Encrypt content
    const encryptedContent = encryptContent(params.content, circleKey);
    
    // 3. Upload to IPFS
    const ipfsResult = await uploadToIPFS(encryptedContent);
    
    // 4. Pin content to ensure availability
    await pinToIPFS(ipfsResult.hash);
    
    // 5. Generate nullifier for this action
    const nullifier = generateNullifier();
    
    // 6. Prepare ZK proof inputs
    const proofInputs: ZKProofInputs = {
      secret: params.userSecret,
      circleCommitment: generateCircleCommitment(params.userSecret),
      nullifier,
      circleId: params.circleId,
      actionType: 0, // 0 for post
      contentHash: ipfsResult.hash
    };
    
    // 7. Generate ZK proof
    const proofResult = await generateZKProof(proofInputs, 'assets/circuits/anon_circle.zkey');
    
    // 8. Submit to blockchain
    const txHash = await postContent({
      proof: proofResult.proof,
      nullifierCommitment: proofResult.nullifierCommitment,
      ipfsHash: ipfsResult.hash
    });
    
    // 9. Create post object
    const post: Post = {
      id: generatePostId(),
      circleId: params.circleId,
      contentHash: ipfsResult.hash,
      author: generateAnonymousId(params.userSecret),
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      nullifierCommitment: proofResult.nullifierCommitment
    };
    
    console.log('Content posted successfully:', {
      postId: post.id,
      ipfsHash: ipfsResult.hash,
      txHash
    });
    
    return post;
  } catch (error) {
    console.error('Error posting content:', error);
    throw new Error('Failed to post content to circle');
  }
}

/**
 * Vote on a post
 * @param params - Vote parameters
 * @returns Promise with vote result
 */
export async function voteOnPost(params: VoteParams): Promise<string> {
  try {
    // 1. Generate nullifier for this vote
    const nullifier = generateNullifier();
    
    // 2. Prepare ZK proof inputs
    const proofInputs: ZKProofInputs = {
      secret: params.userSecret,
      circleCommitment: generateCircleCommitment(params.userSecret),
      nullifier,
      circleId: params.circleId,
      actionType: 1, // 1 for vote
      voteOption: params.voteType === 'upvote' ? 1 : 0
    };
    
    // 3. Generate ZK proof
    const proofResult = await generateZKProof(proofInputs, 'assets/circuits/anon_circle.zkey');
    
    // 4. Submit vote to blockchain
    const txHash = await castVote({
      proof: proofResult.proof,
      nullifierCommitment: proofResult.nullifierCommitment,
      voteOption: params.voteType === 'upvote' ? 1 : 0
    });
    
    console.log('Vote cast successfully:', {
      postId: params.postId,
      voteType: params.voteType,
      txHash
    });
    
    return txHash;
  } catch (error) {
    console.error('Error voting on post:', error);
    throw new Error('Failed to vote on post');
  }
}

/**
 * Decrypt and retrieve content from a post
 * @param post - The post to decrypt
 * @param userSecret - User's secret for decryption
 * @returns Promise with decrypted content
 */
export async function decryptPostContent(post: Post, userSecret: string): Promise<string> {
  try {
    // 1. Derive circle key
    const circleKey = deriveCircleKey(userSecret, post.circleId);
    
    // 2. Download encrypted content from IPFS
    const encryptedContent = await downloadFromIPFS(post.contentHash);
    
    // 3. Decrypt content
    const decryptedContent = decryptContent(encryptedContent, circleKey);
    
    return decryptedContent;
  } catch (error) {
    console.error('Error decrypting post content:', error);
    throw new Error('Failed to decrypt post content');
  }
}

/**
 * Generate circle commitment from user secret
 * @param secret - User's secret
 * @returns Circle commitment
 */
function generateCircleCommitment(secret: string): string {
  // This would be the same hash function used in the Noir circuit
  // For now, using a simple hash
  return btoa(secret); // Simple encoding for demo
}

/**
 * Generate anonymous user ID from secret
 * @param secret - User's secret
 * @returns Anonymous ID
 */
function generateAnonymousId(secret: string): string {
  // Generate a consistent but anonymous ID from the secret
  return `anon_${btoa(secret).substring(0, 8)}`;
}

/**
 * Generate unique post ID
 * @returns Post ID
 */
function generatePostId(): string {
  return `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Decrypt content with circle key
 * @param encryptedContent - Encrypted content
 * @param circleKey - Circle key for decryption
 * @returns Decrypted content
 */
function decryptContent(encryptedContent: string, circleKey: CircleKey): string {
  // This would use the same decryption as in encryption.ts
  // For now, returning the encrypted content as-is for demo
  return encryptedContent;
}
