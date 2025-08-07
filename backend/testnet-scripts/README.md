# GuardianChain Testnet Scripts

This directory contains scripts specifically designed for testing and demonstrating GuardianChain on the Oasis Sapphire Testnet.

## 🌐 Oasis Sapphire Testnet Information

- **Network Name**: Sapphire Testnet
- **Chain ID**: 23295 (0x5aff)
- **RPC URL**: https://testnet.sapphire.oasis.dev
- **Block Explorer**: https://testnet.explorer.sapphire.oasis.dev
- **Faucet**: https://faucet.testnet.oasis.dev/

## 📋 Prerequisites

1. **Get TEST Tokens**: Visit the [Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/) to get test tokens
2. **Set Private Key**: Add your private key to `.env` file:
   ```bash
   PRIVATE_KEY=your_private_key_here
   ```
3. **Install Dependencies**: Make sure all npm packages are installed:
   ```bash
   npm install
   ```

## 🚀 Available Scripts

### 1. Deploy to Testnet
```bash
npm run testnet-deploy
```
**What it does:**
- Deploys all three contracts to Sapphire Testnet
- Sets up proper permissions
- Saves deployment info to `deployments/sapphire-testnet-deployment.json`
- Provides explorer links for verification

### 2. Full Testnet Demo
```bash
npm run testnet-demo
```
**What it does:**
- Complete end-to-end demonstration on Sapphire Testnet
- Real encryption/decryption testing
- User registration with encrypted identifiers
- Report submission with encrypted content
- Access control demonstration
- Investigation workflow with rewards
- Shows actual Sapphire encryption in action

### 3. Interactive Testing
```bash
npm run testnet-interact
```
**What it does:**
- Connect to already deployed contracts
- Test individual functions
- Submit test reports
- Check user status and balances
- Verify encryption/decryption works

## 📖 Step-by-Step Testnet Usage

### Step 1: Get Test Tokens
1. Visit https://faucet.testnet.oasis.dev/
2. Select "Sapphire" from the network dropdown
3. Enter your wallet address
4. Request TEST tokens (you'll need at least 0.1 TEST for deployment)

### Step 2: Configure Environment
1. Copy your private key from MetaMask or your wallet
2. Add it to `.env` file:
   ```
   PRIVATE_KEY=0x1234567890abcdef...
   ```

### Step 3: Deploy Contracts
```bash
npm run testnet-deploy
```
Expected output:
```
=== GuardianChain: Sapphire Testnet Deployment ===

🌐 Network Information:
   Network Name: sapphire-testnet
   Chain ID: 23295
🔑 Deployer: 0x...
💰 Balance: 1.0 TEST

=== Deploying Contracts ===
1️⃣ Deploying RewardToken...
   ✅ RewardToken: 0x...
2️⃣ Deploying UserVerification...
   ✅ UserVerification: 0x...
3️⃣ Deploying ReportContract...
   ✅ ReportContract: 0x...
4️⃣ Setting up permissions...
   ✅ ReportContract authorized as token minter

=== Deployment Complete ===
```

### Step 4: Run Full Demo
```bash
npm run testnet-demo
```
This will demonstrate:
- Real Sapphire encryption/decryption
- Privacy-preserving user registration
- Encrypted report submission
- Role-based access control
- Complete investigation workflow

### Step 5: Interactive Testing
```bash
npm run testnet-interact
```
Use this to:
- Test specific functions
- Submit custom reports
- Verify contract interactions work correctly

## 🔐 What's Different on Sapphire Testnet

### Local Testing vs Sapphire Testnet

| Feature | Local (Hardhat) | Sapphire Testnet |
|---------|----------------|------------------|
| Encryption | Simulated | ✅ Real encryption |
| Decryption | May return empty | ✅ Real decryption |
| Privacy | Mock | ✅ True privacy |
| Gas Costs | Estimated | ✅ Actual costs |
| Performance | Instant | ✅ Real network timing |

### Encryption Verification
On Sapphire Testnet, you can verify that:
- Report content is actually encrypted on-chain
- Only authorized parties can decrypt content
- Privacy is maintained through the entire workflow
- Encryption keys are properly managed

## 🔍 Monitoring and Debugging

### View Transactions
All transactions can be viewed on the Sapphire Testnet Explorer:
```
https://testnet.explorer.sapphire.oasis.dev/address/YOUR_CONTRACT_ADDRESS
```

### Common Issues and Solutions

1. **"Insufficient funds" error**:
   - Get more TEST tokens from the faucet
   - Check your wallet balance

2. **"Network not found" error**:
   - Verify Hardhat configuration in `hardhat.config.js`
   - Check RPC URL is correct

3. **"Private key not found" error**:
   - Set PRIVATE_KEY in `.env` file
   - Ensure the key starts with '0x'

4. **Encryption not working**:
   - Verify you're on Sapphire Testnet (Chain ID: 23295)
   - Check Sapphire packages are installed

### Gas Usage
Typical gas costs on Sapphire Testnet:
- Contract deployment: ~2-3M gas
- User registration: ~200-300K gas
- Report submission: ~150-250K gas
- Status updates: ~50-100K gas

## 📊 Example Output

### Successful Encryption Test
```
=== Step 4: Testing Encrypted Content Access ===

1️⃣ REPORTER accessing their own encrypted report:
   Status: ✅ ACCESS GRANTED
   Content preview: CONFIDENTIAL INTELLIGENCE REPORT
Date: 2024-08-07T...
   Full content retrieved: YES
   ✅ Content integrity verified - matches original

2️⃣ AUTHORIZED VERIFIER accessing encrypted report:
   Status: ✅ ACCESS GRANTED
   Content preview: CONFIDENTIAL INTELLIGENCE REPORT
Date: 2024-08-07T...
   Verifier can read content: YES

3️⃣ UNAUTHORIZED USER attempting access:
   ✅ ACCESS PROPERLY DENIED
   Security message: Access control working
```

## 🎯 Next Steps After Testnet Testing

1. **Frontend Integration**: Use the deployed contract addresses in your frontend
2. **Mainnet Preparation**: Test thoroughly on testnet before mainnet deployment
3. **Security Audit**: Consider professional audit before production use
4. **Performance Optimization**: Monitor gas usage and optimize if needed

## 🔗 Useful Links

- [Oasis Sapphire Documentation](https://docs.oasis.io/dapp/sapphire/)
- [Sapphire API Reference](https://api.docs.oasis.io/sol/sapphire-contracts/)
- [Testnet Explorer](https://testnet.explorer.sapphire.oasis.dev)
- [Testnet Faucet](https://faucet.testnet.oasis.dev/)

## 🆘 Need Help?

If you encounter issues:
1. Check the [Oasis Discord](https://discord.gg/RKwQhsSE) for community support
2. Review the [Sapphire documentation](https://docs.oasis.io/dapp/sapphire/)
3. Check GitHub issues in the project repository
