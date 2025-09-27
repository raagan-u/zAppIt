#!/usr/bin/env node

/**
 * Script to update mobile app with deployed contract addresses
 * Usage: node scripts/update-contract-config.js <verifier_address> <contract_address> <network>
 */

const fs = require('fs');
const path = require('path');

const [,, verifierAddress, contractAddress, network = 'sepolia'] = process.argv;

if (!verifierAddress || !contractAddress) {
  console.error('Usage: node update-contract-config.js <verifier_address> <contract_address> [network]');
  process.exit(1);
}

const config = {
  network,
  verifierAddress,
  contractAddress,
  rpcUrl: network === 'sepolia' 
    ? 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
    : 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  chainId: network === 'sepolia' ? 11155111 : 1,
  deployedAt: new Date().toISOString()
};

const configPath = path.join(__dirname, '..', 'mobile', 'src', 'config', 'contract.json');

// Ensure config directory exists
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Write config file
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Contract configuration updated:');
console.log(`📄 Config file: ${configPath}`);
console.log(`🌐 Network: ${network}`);
console.log(`🔐 Verifier: ${verifierAddress}`);
console.log(`📋 Contract: ${contractAddress}`);
console.log(`⛓️  Chain ID: ${config.chainId}`);
