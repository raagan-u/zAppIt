/**
 * Pinata IPFS configuration
 * Get your JWT from https://app.pinata.cloud/developers/api-keys
 */

export const PINATA_CONFIG = {
  // Replace with your actual Pinata JWT
  PINATA_JWT:
    process.env.PINATA_JWT ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3YmU1M2JlNi0zNzM0LTQ5YWUtODc0Zi0yOTQwODNiNjIzNDYiLCJlbWFpbCI6ImFkaXR5YS52aXNod2FuYXRoYW5fY3MyMUBnbGEuYWMuaW4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZDBlNTMwZDE3YTE0MGM0NGMzNzEiLCJzY29wZWRLZXlTZWNyZXQiOiJlM2RiMjdjMjM0ODMwYzFiOTlkYTgxMDA5ZjQ5ODZmZDdhYzIxZGVkY2M4MDRiY2QwY2QwMDU5NDY4MWRkODBiIiwiZXhwIjoxNzkwNTA4MDM3fQ.cIv15XVbWPEb0rLS-BACgICv9gN14yB8rc_QDbCrv9o",

  // Default gateway (you can use your custom gateway)
  PINATA_GATEWAY:
    process.env.PINATA_GATEWAY || "green-random-weasel-506.mypinata.cloud",
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
