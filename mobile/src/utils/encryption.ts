import * as SecureStore from "expo-secure-store";
import { CircleKey, EncryptedContent } from "../types";

/**
 * Encryption utilities for circle content
 * All content is encrypted with circle keys derived from secret + circleId
 */

/**
 * Derive a circle key from secret and circle ID
 */
export function deriveCircleKey(secret: string, circleId: string): CircleKey {
  // For demo purposes, using simple concatenation and hashing
  // In production, use proper PBKDF2 or similar key derivation
  const combined = secret + circleId;
  const key = btoa(combined).substring(0, 32); // Simple key derivation

  return {
    key: key,
    derivedFrom: { secret, circleId },
  };
}

/**
 * Encrypt content with circle key
 */
export function encryptContent(content: string, circleKey: CircleKey): string {
  // For demo purposes, using simple base64 encoding
  // In production, use proper AES encryption
  const encrypted = btoa(content);
  return encrypted;
}

/**
 * Decrypt content with circle key
 */
export function decryptContent(
  encryptedContent: string,
  circleKey: CircleKey
): string {
  // For demo purposes, using simple base64 decoding
  // In production, use proper AES decryption
  const decrypted = atob(encryptedContent);
  return decrypted;
}

/**
 * Generate a random nullifier for preventing double actions
 */
export function generateNullifier(): string {
  // For demo purposes, using Math.random
  // In production, use proper cryptographically secure random generation
  const randomBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
  return randomBytes;
}

/**
 * Hash content for IPFS storage
 */
export function hashContent(content: string): string {
  // For demo purposes, using simple hash
  // In production, use proper SHA-256 hashing
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Store user secret securely
 */
export async function storeUserSecret(secret: string): Promise<void> {
  await SecureStore.setItemAsync("userSecret", secret);
}

/**
 * Retrieve user secret
 */
export async function getUserSecret(): Promise<string | null> {
  return await SecureStore.getItemAsync("userSecret");
}

/**
 * Sanitize key for SecureStore (only alphanumeric, ".", "-", "_" allowed)
 */
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Convert circle ID to numeric format for contract compatibility
 */
export function circleIdToNumeric(circleId: string): string {
  // If already numeric, return as is
  if (/^\d+$/.test(circleId)) {
    return circleId;
  }

  // Convert string to numeric hash
  let hash = 0;
  for (let i = 0; i < circleId.length; i++) {
    const char = circleId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Store circle membership
 */
export async function storeCircleMembership(
  circleId: string,
  secret: string
): Promise<void> {
  const sanitizedCircleId = sanitizeKey(circleId);
  const key = `circle_${sanitizedCircleId}`;
  await SecureStore.setItemAsync(key, secret);

  // Update the joined circles list
  await updateJoinedCirclesList(sanitizedCircleId, "add");
}

/**
 * Get circle membership secret
 */
export async function getCircleMembership(
  circleId: string
): Promise<string | null> {
  const sanitizedCircleId = sanitizeKey(circleId);
  const key = `circle_${sanitizedCircleId}`;
  return await SecureStore.getItemAsync(key);
}

/**
 * Generate a random secret for circle creation
 */
export function generateRandomSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Store circle info locally (name, description, etc.)
 */
export async function storeCircleInfo(
  circleId: string,
  circleInfo: {
    name: string;
    description: string;
    joinedAt: number;
  }
): Promise<void> {
  const key = `circle_info_${sanitizeKey(circleId)}`;
  await SecureStore.setItemAsync(key, JSON.stringify(circleInfo));
}

/**
 * Get circle info from local storage
 */
export async function getCircleInfo(circleId: string): Promise<any | null> {
  const key = `circle_info_${sanitizeKey(circleId)}`;
  const info = await SecureStore.getItemAsync(key);
  return info ? JSON.parse(info) : null;
}

/**
 * Update the joined circles list
 */
async function updateJoinedCirclesList(
  circleId: string,
  action: "add" | "remove"
): Promise<void> {
  try {
    const joinedCirclesKey = "joined_circles_list";
    const currentData = await SecureStore.getItemAsync(joinedCirclesKey);
    let circleIds: string[] = currentData ? JSON.parse(currentData) : [];

    if (action === "add") {
      if (!circleIds.includes(circleId)) {
        circleIds.push(circleId);
      }
    } else if (action === "remove") {
      circleIds = circleIds.filter((id) => id !== circleId);
    }

    await SecureStore.setItemAsync(joinedCirclesKey, JSON.stringify(circleIds));
    console.log(`Updated joined circles list (${action}):`, circleIds);
  } catch (error) {
    console.error("Error updating joined circles list:", error);
  }
}

/**
 * Get all joined circles (circle IDs only)
 */
export async function getAllJoinedCircleIds(): Promise<string[]> {
  try {
    // Since SecureStore doesn't have getAllKeysAsync, we'll store a list of joined circles
    const joinedCirclesKey = "joined_circles_list";
    const joinedCirclesData = await SecureStore.getItemAsync(joinedCirclesKey);

    if (joinedCirclesData) {
      const circleIds = JSON.parse(joinedCirclesData);
      console.log("Found joined circle IDs:", circleIds);
      return circleIds;
    }

    console.log("No joined circles found");
    return [];
  } catch (error) {
    console.error("Error getting joined circle IDs:", error);
    return [];
  }
}

/**
 * Remove circle membership
 */
export async function removeCircleMembership(circleId: string): Promise<void> {
  const sanitizedCircleId = sanitizeKey(circleId);
  const membershipKey = `circle_${sanitizedCircleId}`;
  const infoKey = `circle_info_${sanitizedCircleId}`;

  await SecureStore.deleteItemAsync(membershipKey);
  await SecureStore.deleteItemAsync(infoKey);

  // Update the joined circles list
  await updateJoinedCirclesList(sanitizedCircleId, "remove");
}
