#!/bin/bash

# Deployment script for Anonymous ZK Reddit contracts

set -e

echo "🚀 Deploying Anonymous ZK Reddit contracts..."

# Check if .env file exists
if [ ! -f "foundry/.env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and fill in your values."
    exit 1
fi

# Load environment variables
source foundry/.env

# Check if required variables are set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ PRIVATE_KEY not set in .env file"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ] || [ "$SEPOLIA_RPC_URL" = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY" ]; then
    echo "❌ SEPOLIA_RPC_URL not set in .env file"
    exit 1
fi

echo "📋 Configuration:"
echo "   Network: Sepolia"
echo "   RPC URL: $SEPOLIA_RPC_URL"
echo "   Private Key: ${PRIVATE_KEY:0:10}..."

# Build contracts
echo "🔨 Building contracts..."
cd foundry
forge build

# Run tests
echo "🧪 Running tests..."
forge test

# Deploy contracts
echo "🚀 Deploying to Sepolia..."
forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployed contract addresses"
echo "2. Update mobile app config:"
echo "   node scripts/update-contract-config.js <verifier_address> <contract_address> sepolia"
echo "3. Test the mobile app with the deployed contracts"
