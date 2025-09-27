import CryptoJS from 'react-native-crypto-js';
import * as SecureStore from 'expo-secure-store';
import { CircleKey, EncryptedContent } from '../types';

/**
 * Encryption utilities for circle content
 * All content is encrypted with circle keys derived from secret + circleId
 */

/**
 * Derive a circle key from secret and circle ID
 */
export function deriveCircleKey(secret: string, circleId: string): CircleKey {
  // Use PBKDF2 to derive a key from secret + circleId
  const salt = CryptoJS.enc.Utf8.parse(circleId);
  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: 256 / 32,
    iterations: 10000
  });
  
  return {
    key: key.toString(),
    derivedFrom: { secret, circleId }
  };
}

/**
 * Encrypt content with circle key
 */
export function encryptContent(content: string, circleKey: CircleKey): string {
  const encrypted = CryptoJS.AES.encrypt(content, circleKey.key).toString();
  return encrypted;
}

/**
 * Decrypt content with circle key
 */
export function decryptContent(encryptedContent: string, circleKey: CircleKey): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedContent, circleKey.key);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a random nullifier for preventing double actions
 */
export function generateNullifier(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * Hash content for IPFS storage
 */
export function hashContent(content: string): string {
  return CryptoJS.SHA256(content).toString();
}

/**
 * Store user secret securely
 */
export async function storeUserSecret(secret: string): Promise<void> {
  await SecureStore.setItemAsync('userSecret', secret);
}

/**
 * Retrieve user secret
 */
export async function getUserSecret(): Promise<string | null> {
  return await SecureStore.getItemAsync('userSecret');
}

/**
 * Store circle membership
 */
export async function storeCircleMembership(circleId: string, secret: string): Promise<void> {
  const key = `circle_${circleId}`;
  await SecureStore.setItemAsync(key, secret);
}

/**
 * Get circle membership secret
 */
export async function getCircleMembership(circleId: string): Promise<string | null> {
  const key = `circle_${circleId}`;
  return await SecureStore.getItemAsync(key);
}