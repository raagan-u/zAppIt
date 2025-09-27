# Smart Contract Deployment Guide

## Prerequisites

1. **Foundry installed** (already done)
2. **Private key** with testnet ETH
3. **Infura/Alchemy account** for RPC access

## Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values in `.env`:**
   ```
   PRIVATE_KEY=your_private_key_without_0x_prefix
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

## Deployment Commands

### Deploy to Sepolia Testnet

```bash
# Deploy contracts
forge script script/DeploySepolia.s.sol --rpc-url sepolia --broadcast --verify

# Or with custom RPC
forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Deploy to Local Network

```bash
# Start local node (in another terminal)
anvil

# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Update Mobile App

After deployment, update the mobile app with contract addresses:

```bash
# Update mobile app config
node ../scripts/update-contract-config.js <verifier_address> <contract_address> sepolia
```

## Testing

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testPostContent
```

## Verification

```bash
# Verify on Etherscan
forge verify-contract <contract_address> src/PrivateCircle.sol --etherscan-api-key $ETHERSCAN_API_KEY --chain sepolia
```

## Gas Optimization

The contracts are optimized for gas efficiency:
- Uses `uint256` for nullifier commitments
- Minimal storage operations
- Efficient event emission
- No unnecessary computations
