# Anonymous ZK Reddit - Private Circles

A zero-knowledge Reddit clone where everything is anonymous and organized into private circles. Users need a secret to join circles, and all content is encrypted and verified on-chain using zk proofs.

## Architecture

- **Frontend**: React Native mobile app
- **ZK Proofs**: Noir circuits compiled with Mopro
- **Storage**: IPFS/Arweave for encrypted content
- **Blockchain**: Solidity verifier contract for proof verification
- **Privacy**: Fully anonymous with encrypted content

## Project Structure

```
jujyno/
├── circuits/           # Noir zk circuits
├── mobile/            # React Native app
├── contracts/         # Solidity smart contracts
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## Features

- Anonymous posting and voting
- Private circles with secret-based membership
- Encrypted content storage
- On-chain proof verification
- Support for any file type (text, images, audio, etc.)

## Getting Started

1. Set up Noir development environment
2. Compile circuits with Mopro
3. Initialize React Native project
4. Deploy smart contracts
5. Configure IPFS storage

## Hackathon Timeline

- **Phase 1**: Project structure and Noir circuits
- **Phase 2**: React Native app with Mopro integration
- **Phase 3**: Smart contract deployment
- **Phase 4**: IPFS integration and testing
