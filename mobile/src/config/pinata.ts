/**
 * Pinata IPFS configuration
 * Get your JWT from https://app.pinata.cloud/developers/api-keys
 */

export const PINATA_CONFIG = {
  // Replace with your actual Pinata JWT
  PINATA_JWT: process.env.PINATA_JWT || "your_pinata_jwt_here",
  
  // Default gateway (you can use your custom gateway)
  PINATA_GATEWAY: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
};

/**
 * Instructions for setting up Pinata:
 * 
 * 1. Go to https://app.pinata.cloud/developers/api-keys
 * 2. Create a new API key
 * 3. Copy the JWT token
 * 4. Set PINATA_JWT environment variable or update this file
 * 
 * For production, use environment variables:
 * - PINATA_JWT=your_actual_jwt_here
 * - PINATA_GATEWAY=your-custom-gateway.mypinata.cloud (optional)
 */
