# GuardianChain Backend

A decentralized reporting platform built on Oasis Sapphire Network, featuring encrypted data storage and privacy-preserving user verification.

## Overview

GuardianChain enables users to submit confidential reports while maintaining privacy through Oasis Sapphire's encryption capabilities. The system includes user verification, encrypted report submission, authority investigation, and token-based rewards.

## Features

- **Privacy-First**: All sensitive data (user identifiers, report content) is encrypted on-chain using Oasis Sapphire
- **User Verification**: Multi-step verification process ensuring legitimate users
- **Decentralized Reporting**: Submit reports that remain private until authorized personnel access them
- **Reward System**: Token-based incentives for verified reports and successful investigations
- **Authority Management**: Role-based access for investigators and verifiers

## Smart Contracts

### 1. UserVerification.sol
Manages user registration and verification with encrypted data storage.

**Key Features:**
- Encrypted identifier storage
- Verification status management  
- Admin-controlled verification process
- Privacy-preserving user metadata

### 2. ReportContract.sol
Handles encrypted report submission, investigation, and rewards.

**Key Features:**
- Encrypted report content storage
- Status tracking (Pending → Investigating → Verified/Rejected)
- Reward distribution for verified reports
- Authority-only content access

### 3. RewardToken.sol
ERC20-compatible token for rewarding platform participants.

**Key Features:**
- Mintable tokens for rewards
- Authorized minter system
- Standard transfer functionality

## Setup and Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Git

### Installation

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your private key and configuration
```

4. **Compile contracts:**
```bash
npm run compile
```

5. **Run tests:**
```bash
npm test
```

## Deployment

### Local Development (Localnet)

1. **Start Oasis Sapphire Localnet:**
```bash
# Using Docker (recommended)
docker run -it -p8545:8545 -p8546:8546 ghcr.io/oasisprotocol/sapphire-localnet -test-mnemonic

# Or using the Oasis CLI
oasis test-net run-simple --fixture.default.num_entities=1
```

2. **Deploy to Localnet:**
```bash
npm run localnet-deploy
```

3. **Fund test accounts:**
The localnet provides pre-funded accounts. Use the test mnemonic to access them:
```
Test mnemonic: "test test test test test test test test test test test junk"
```

4. **Contract addresses:**
After deployment, contract addresses will be saved to `deployments/localhost/` and displayed in the console.

### Testnet Deployment

1. **Fund your wallet** with TEST tokens from the [Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/)

2. **Deploy to Sapphire Testnet:**
```bash
npm run deploy:testnet
```

### Mainnet Deployment

1. **Fund your wallet** with ROSE tokens

2. **Deploy to Sapphire Mainnet:**
```bash
npm run deploy:mainnet
```

## Contract Interaction

### User Registration Flow

1. **Register User:**
```javascript
// User calls registerUser with encrypted identifier
await userVerification.registerUser("user_identifier", longevityScore);
```

2. **Admin Verification:**
```javascript
// Admin verifies the user
await userVerification.verifyUser(userAddress);
```

### Report Submission Flow

1. **Submit Report:**
```javascript
// Verified user submits encrypted report
await reportContract.submitReport("Confidential report content");
```

2. **Investigation:**
```javascript
// Authority updates status
await reportContract.updateReportStatus(reportId, ReportStatus.Investigating);
```

3. **Verification:**
```javascript
// Authority verifies report
await reportContract.updateReportStatus(reportId, ReportStatus.Verified);
```

4. **Claim Reward:**
```javascript
// User claims reward for verified report
await reportContract.claimReward(reportId);
```

## Privacy Features

### Encryption Model
- **User Identifiers**: Encrypted using user-specific keys derived from their address
- **Report Content**: Encrypted with report-specific keys, accessible only to reporter and authorities
- **Key Derivation**: Uses Sapphire's secure randomness and cryptographic functions

### Access Control
- **Report Content**: Only accessible by the reporter and authorized verifiers
- **User Data**: Users can decrypt their own data, admins see only verification status
- **Public Information**: Report metadata (timestamp, status, hash) remains public for transparency

## Testing

The project includes comprehensive tests covering:

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run specific test file
npx hardhat test test/GuardianChain.test.js
```

## Network Configuration

### Sapphire Localnet (Development)
- **Chain ID**: 0x5afd (23293)
- **RPC URL**: http://localhost:8545
- **WebSocket**: ws://localhost:8546
- **Block Explorer**: http://localhost:8548 (if available)
- **Currency**: TEST tokens

### Sapphire Testnet
- **Chain ID**: 0x5aff (23295)
- **RPC URL**: https://testnet.sapphire.oasis.dev
- **Block Explorer**: https://testnet.explorer.sapphire.oasis.dev

### Sapphire Mainnet  
- **Chain ID**: 0x5afe (23294)
- **RPC URL**: https://sapphire.oasis.io
- **Block Explorer**: https://explorer.sapphire.oasis.io

## Gas Optimization

The contracts are optimized for Sapphire's gas costs:
- Efficient storage patterns
- Minimal external calls
- Batch operations where possible
- Gas-aware encryption operations

## Security Considerations

### Encryption
- All sensitive data encrypted before storage
- Keys derived deterministically but securely
- Nonce-based encryption prevents replay attacks

### Access Control
- Multi-level permission system
- Admin functions protected
- User verification requirements

### Data Integrity
- Content hashes for verification
- Immutable report IDs
- Status change logging

## Development Workflow

### Adding New Features

1. **Smart Contract Changes:**
   - Modify contracts in `/contracts`
   - Update tests in `/test`
   - Run `npm test` to verify

2. **Deployment Updates:**
   - Update deployment script if needed
   - Test on testnet first
   - Document new contract addresses

### Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality  
4. Ensure all tests pass
5. Submit pull request

## API Reference

### UserVerification Contract

```solidity
// Register new user with encrypted identifier
function registerUser(string memory identifier, uint256 longevity) external

// Verify user (admin only)
function verifyUser(address userAddress) external

// Get user's own decrypted identifier
function getMyIdentifier() external view returns (string memory)

// Check verification status
function getUserStatus(address userAddress) external view 
    returns (bool isVerified, uint256 createdAt, uint256 longevity)
```

### ReportContract Contract

```solidity
// Submit encrypted report
function submitReport(string memory content) external

// Update report status (verifiers only)
function updateReportStatus(uint256 reportId, ReportStatus newStatus) external

// Claim reward for verified report
function claimReward(uint256 reportId) external

// Get decrypted report content (authorized only)
function getReportContent(uint256 reportId) external view returns (string memory)

// Get public report info
function getReportInfo(uint256 reportId) external view 
    returns (uint256 id, address reporter, uint256 timestamp, ...)
```

## Troubleshooting

### Common Issues

1. **Deployment Fails:**
   - Check ROSE balance in wallet
   - Verify network configuration
   - Ensure private key is correctly set

2. **Tests Fail:**
   - Run `npm run clean` and recompile
   - Check Hardhat network configuration
   - Verify Sapphire packages are installed

3. **Encryption Errors:**
   - Ensure using Sapphire network
   - Check contract imports
   - Verify Sapphire Hardhat plugin is configured

### Getting Help

- [Oasis Sapphire Documentation](https://docs.oasis.io/dapp/sapphire/)
- [Sapphire Smart Contracts API](https://api.docs.oasis.io/sol/sapphire-contracts/)
- [GitHub Issues](https://github.com/your-repo/issues)

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built on [Oasis Sapphire](https://oasisprotocol.org/sapphire) for privacy features
- Inspired by decentralized reporting and verification systems
- Uses [Hardhat](https://hardhat.org/) development framework


# Specific test commands

npm test - Run all tests
npm run test:verbose - Detailed test output
npm run test:gas - Gas usage reporting
npm run full-demo - Complete workflow demo
npm run content-test - Encryption testing
npm run localnet-demo - Docker localnet testing
