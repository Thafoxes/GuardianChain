# 🚀 Sapphire Testnet Setup Guide

## The deployme1. **Visit the faucet:** https://faucet.testnet.oasis.dev/
2. **Select "Sapphire"** from the network dropdown
3. **Enter your wallet address** (the one corresponding to your private key)
4. **Request TEST tokens**
5. **Wait for confirmation** (usually takes 1-2 minutes)rror you encountered means your wallet needs setup for Sapphire Testnet.

### ❌ Current Issue:
Your deployment is trying to use a default private key that has no ROSE tokens on Sapphire Testnet.

### ✅ Solution Steps:

## Step 1: Get a Wallet with ROSE Tokens

### Option A: Use MetaMask (Recommended)
1. **Install MetaMask** if you don't have it
2. **Create a new account** or use existing one
3. **Add Sapphire Testnet to MetaMask:**
   - Network Name: `Sapphire Testnet`
   - RPC URL: `https://testnet.sapphire.oasis.dev`
   - Chain ID: `23295`
   - Currency Symbol: `TEST`
   - Block Explorer: `https://testnet.explorer.sapphire.oasis.dev`

4. **Get Test TEST Tokens:**
   - Visit: https://faucet.testnet.oasis.dev/
   - Select "Sapphire" from the network dropdown
   - Enter your wallet address
   - Request tokens (you'll get TEST tokens)

### Option B: Create New Wallet via Script
```bash
# Generate a new wallet
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
"
```

## Step 2: Update Your .env File

1. **Copy your private key** from MetaMask:
   - MetaMask → Account Details → Export Private Key
   
2. **Update `.env` file:**
   ```
   PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
   ```

⚠️ **IMPORTANT:** Never share or commit your real private key!

## Step 3: Fund Your Wallet

1. **Visit the faucet:** https://faucet.testnet.oasis.dev/
2. **Enter your wallet address** (the one corresponding to your private key)
3. **Request TEST tokens**
4. **Wait for confirmation** (usually takes 1-2 minutes)

## Step 4: Verify Setup

```bash
# Check your wallet has ROSE tokens
npx hardhat run testnet-scripts/deploy-testnet.js --network sapphire-testnet
```

Expected output:
```
=== GuardianChain: Sapphire Testnet Deployment ===

🌐 Network Information:
   Network Name: sapphire-testnet
   Chain ID: 23295
Available signers: 1
🔑 Deployer: 0xYourAddress...
💰 Balance: 1.0 TEST
```

## Step 5: Deploy and Test

```bash
# Deploy contracts
npm run testnet-deploy

# Run full demo
npm run testnet-demo
```

## 🔍 Troubleshooting

### "Insufficient balance" error:
- Get more TEST tokens from faucet
- Wait for faucet transaction to confirm

### "Network not found" error:
- Check Hardhat config in `hardhat.config.js`
- Verify RPC URL is correct

### "Invalid private key" error:
- Ensure private key starts with '0x'
- Check for extra spaces in .env file

## 🎯 Quick Test Command

To quickly verify everything is working:

```bash
# This will check network, balance, and deploy contracts
npm run testnet-deploy
```

If successful, you'll see contract addresses and explorer links! 🎉

## 💡 Pro Tips

1. **Keep testnet and mainnet keys separate**
2. **Use different wallets for testing vs production**
3. **Never use the same private key across multiple projects**
4. **Always verify contract addresses before interacting**

## 🔗 Useful Links

- **Sapphire Testnet Faucet:** https://faucet.testnet.oasis.dev/
- **Block Explorer:** https://testnet.explorer.sapphire.oasis.dev
- **Oasis Docs:** https://docs.oasis.io/dapp/sapphire/
- **MetaMask Setup:** https://docs.oasis.io/general/manage-tokens/how-to-transfer-rose-into-emerald-paratime#set-up-metamask
