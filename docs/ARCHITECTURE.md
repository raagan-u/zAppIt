# Architecture Overview

## System Components

### 1. Mobile App (React Native)
- **Secret Storage**: Local secure storage of user secrets
- **Content Encryption**: Encrypt/decrypt content with circle keys
- **ZK Proof Generation**: Generate proofs using Mopro
- **IPFS Integration**: Upload/download encrypted content

### 2. Noir Circuits
- **Membership Proof**: Verify user belongs to circle
- **Nullifier Commitments**: Prevent double-posting/voting
- **Action Verification**: Validate posts and votes

### 3. Smart Contract (Solidity)
- **Proof Verification**: Verify zk proofs on-chain
- **Nullifier Tracking**: Prevent double actions
- **Event Emission**: Track content and votes

### 4. Storage Layer
- **IPFS/Arweave**: Store encrypted content
- **On-chain**: Store only content hashes and nullifier commitments

## Data Flow

```
User Action → Generate ZK Proof → Encrypt Content → Upload to IPFS → Submit to Contract
```

## Privacy Guarantees

1. **Membership Privacy**: ZK proofs hide user identity
2. **Content Privacy**: All content encrypted with circle keys
3. **Action Privacy**: Nullifier commitments prevent linking
4. **Circle Privacy**: Circle membership is hidden

## Security Model

- **Local Secrets**: Never leave the device
- **Encrypted Storage**: All content encrypted before upload
- **ZK Verification**: On-chain verification without revealing secrets
- **Nullifier System**: Prevents spam and double actions
