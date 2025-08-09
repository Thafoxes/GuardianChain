# 🚀 Sapphire Testnet Migration Guide

## 📋 Prerequisites
1. **Create a new wallet** for testnet (don't use your main wallet)
2. **Get TEST tokens** from: https://faucet.testnet.oasis.dev/
3. **Copy your testnet private key** (keep it secure!)

## 🔧 Setup Steps

### 1. Add Testnet Private Key to Backend .env
```bash
cd backend
```

Add this line to your `.env` file:
```env
TESTNET_PRIVATE_KEY=your_testnet_private_key_here
```

### 2. Deploy Contracts to Testnet
```bash
npm install
npx hardhat run scripts/deploy-testnet.js --network sapphire-testnet
```

### 3. Update Environment Files
After deployment, copy the contract addresses from the output and update:

**Frontend .env:**
```env
VITE_CONTRACT_ADDRESS_REWARD_TOKEN=deployed_address
VITE_CONTRACT_ADDRESS_USER_VERIFICATION=deployed_address
VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=deployed_address
VITE_TREASURY_ADDRESS=your_deployer_address
```

**API .env:**
```env
REWARD_TOKEN_ADDRESS=deployed_address
USER_VERIFICATION_ADDRESS=deployed_address
REPORT_CONTRACT_ADDRESS=deployed_address
TESTNET_PRIVATE_KEY=your_testnet_private_key
BACKEND_PRIVATE_KEY=your_testnet_private_key
```

### 4. Restart Services
```bash
# API
cd api
npm start

# Frontend
cd frontend
npm run dev
```

### 5. Connect MetaMask to Testnet
1. Open MetaMask
2. Your frontend will automatically prompt to add Sapphire Testnet
3. Or manually add network:
   - Network Name: Sapphire Testnet
   - RPC URL: https://testnet.sapphire.oasis.io
   - Chain ID: 23295
   - Currency: TEST

### 6. Register Your Wallet
```bash
POST http://localhost:3001/api/users/register
{
  "identifier": "your-email@example.com",
  "longevity": 10,
  "walletAddress": "your_metamask_address"
}
```

### 7. Test Report Submission
Now you can submit reports directly from the frontend, and they'll be signed with your actual wallet address!

## ✅ Benefits of Testnet
- ✅ Real Sapphire network (no encryption issues)
- ✅ Persistent data (contracts stay deployed)
- ✅ Public explorer for transaction viewing
- ✅ Proper user authentication with MetaMask
- ✅ Reports show correct reporter address

## 🔗 Useful Links
- **Faucet**: https://faucet.testnet.oasis.dev/
- **Explorer**: https://testnet.explorer.sapphire.oasis.io/
- **Docs**: https://docs.oasis.io/dapp/sapphire/
