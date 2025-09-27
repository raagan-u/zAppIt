/**
 * Core types for Anonymous ZK Reddit app
 */

export interface Circle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  secret?: string; // Only present if user is a member
}

export interface Post {
  id: string;
  circleId: string;
  contentHash: string; // IPFS hash of encrypted content
  author: string; // Anonymous identifier
  timestamp: number;
  upvotes: number;
  downvotes: number;
  nullifierCommitment: string;
}

export interface Vote {
  postId: string;
  voteType: 'upvote' | 'downvote';
  nullifierCommitment: string;
}

export interface UserSecret {
  secret: string;
  circles: string[]; // Circle IDs where user is a member
}

export interface ZKProofInputs {
  secret: string;
  circleCommitment: string;
  nullifier: string;
  circleId: string;
  actionType: number; // 0 for post, 1 for vote
  contentHash?: string;
  voteOption?: number;
}

export interface ZKProofResult {
  proof: any; // The actual zk proof
  publicInputs: string[];
  nullifierCommitment: string;
}

export interface EncryptedContent {
  content: string;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'file';
  encryptedData: string;
  ipfsHash: string;
}

export interface CircleKey {
  key: string;
  derivedFrom: {
    secret: string;
    circleId: string;
  };
}
