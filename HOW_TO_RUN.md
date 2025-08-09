# 🚀 GuardianChain - Complete Setup Guide

This guide will walk you through setting up and running the complete GuardianChain application stack: **Backend Blockchain** → **API Server** → **Frontend React App**.

## 📋 **Prerequisites**

Before starting, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Docker Desktop** installed and running
- **MetaMask** browser extension
- **Git** for cloning repositories

## 🏗️ **Project Structure Overview**

```
GuardianChain/
├── backend/          # Smart contracts & blockchain deployment
├── api/              # REST API server (connects frontend to blockchain)
├── frontend/         # React TypeScript frontend
└── HOW_TO_RUN.md    # This guide
```

---

## 🐳 **Step 1: Start Backend Blockchain (Docker)**

The backend runs an Oasis Sapphire blockchain in Docker with pre-funded test accounts.

### **1.1 Navigate to Project Root**
```bash
cd GuardianChain
```

### **1.2 Start Oasis Sapphire Localnet**
```bash
# Start Docker container with blockchain
docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet:latest-2025-08-05-gita4d5d8b 
```

**✅ What this does:**
- Starts Oasis Sapphire blockchain on `http://localhost:8545`
- Creates 5 pre-funded accounts with **10,000 TEST tokens** each
- Uses test mnemonic: `"test test test test test test test test test test test junk"`
- Enables privacy features for encrypted smart contracts

**🔍 You should see:**
```
Starting Oasis Sapphire localnet...
JSON-RPC server listening on 0.0.0.0:8545
WebSocket server listening on 0.0.0.0:8546
5 accounts generated with 10000 TEST tokens each
```

### **1.3 Deploy Smart Contracts**

**Open a NEW terminal** (keep Docker running) and deploy contracts:

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Copy environment configuration
cp .env.example .env

# Deploy contracts to Docker blockchain
npm run localnet-deploy
```

**✅ Expected Output:**
```
Deploying to Sapphire Localnet...
✅ RewardToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ UserVerification deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512  
✅ ReportContract deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ Deployment complete!
```

**📝 Save these contract addresses** - you'll need them for the frontend!

### **1.4 Test Blockchain Connection (Optional)**
```bash
# Test that everything is working
npm run content-test
```

---

## 🌐 **TESTNET DEPLOYMENT** 

If you want to deploy to **Sapphire Testnet** instead of local development, follow this section. Skip to **Step 2** if you're doing local development.

### **Prerequisites for Testnet**

1. **MetaMask** with Sapphire Testnet configured
2. **TEST tokens** from the faucet
3. **Private keys** for deployment

### **T1: Configure Sapphire Testnet in MetaMask**

1. **Open MetaMask** → **Networks** → **Add Network** → **Add Network Manually**

2. **Enter Network Details:**
   ```
   Network name: Sapphire Testnet
   New RPC URL: https://testnet.sapphire.oasis.dev
   Chain ID: 23295
   Currency symbol: TEST
   Block explorer URL: https://testnet.explorer.sapphire.oasis.dev
   ```

3. **Click "Save"**

### **T2: Get TEST Tokens from Faucet**

1. **Visit:** https://faucet.testnet.oasis.dev/
2. **Select "Sapphire"** from the network dropdown
3. **Enter your wallet address**
4. **Request tokens** (you'll receive TEST tokens)
5. **Wait 1-2 minutes** for confirmation

### **T3: Deploy Backend Smart Contracts to Testnet**

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Copy environment configuration
cp .env.example .env
```

**Edit `backend/.env` file:**
```env
# Replace with your actual private key (from MetaMask)
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Testnet configuration (already set in hardhat.config.js)
NODE_ENV=production
```

**⚠️ SECURITY WARNING:** Never share or commit your real private key!

**Deploy to Sapphire Testnet:**
```bash
# Deploy contracts to Sapphire Testnet
npm run testnet-deploy
```

**✅ Expected Output:**
```
🚀 === Deploying GuardianChain to Sapphire Testnet === 🚀
✅ Connected to Sapphire Testnet
💰 Account balance: 1.0 TEST
✅ RewardToken deployed to: 0x742d35Cc6634C0532925a3b8D4c...
✅ UserVerification deployed to: 0x742d35Cc6634C0532925a3b8D4c...  
✅ ReportContract deployed to: 0x742d35Cc6634C0532925a3b8D4c...
✅ All contracts deployed successfully!
```

**📝 IMPORTANT:** Save these contract addresses for API and Frontend configuration!

### **T4: Configure and Start API Server for Testnet**

```bash
# Navigate to API folder
cd ../api

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

**Edit `api/.env` file:**
```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Network Configuration
NETWORK=testnet

# Contract Addresses (update with your deployed addresses from T3)
REWARD_TOKEN_ADDRESS=0xYOUR_REWARD_TOKEN_ADDRESS
USER_VERIFICATION_ADDRESS=0xYOUR_USER_VERIFICATION_ADDRESS  
REPORT_CONTRACT_ADDRESS=0xYOUR_REPORT_CONTRACT_ADDRESS

# Backend wallet (use same private key as deployment)
BACKEND_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Stake settings
STAKE_AMOUNT=10
TREASURY_ADDRESS=0xYOUR_WALLET_ADDRESS
TREASURY_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
```

**Start API Server:**
```bash
npm run dev
```

**✅ Expected Output:**
```
🚀 GuardianChain API Server starting...
✅ Connected to Sapphire Testnet
🔗 Loaded contract: RewardToken at 0x742d35Cc...
🔗 Loaded contract: UserVerification at 0x742d35Cc...
🔗 Loaded contract: ReportContract at 0x742d35Cc...
🌐 Server running on http://localhost:3001
```

### **T5: Configure and Start Frontend for Testnet**

```bash
# Navigate to Frontend folder  
cd ../frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

**Edit `frontend/.env` file:**
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_NETWORK=testnet

# Contract Addresses (update with your deployed addresses from T3)
VITE_CONTRACT_ADDRESS_USER_VERIFICATION=0xYOUR_USER_VERIFICATION_ADDRESS
VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=0xYOUR_REPORT_CONTRACT_ADDRESS

# Testnet RPC (optional override)
VITE_TESTNET_RPC=https://testnet.sapphire.oasis.dev
```

**Start Frontend:**
```bash
npm run dev
```

**✅ Expected Output:**
```
  VITE v5.x.x ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### **T6: Test Testnet Deployment**

1. **Open application:** `http://localhost:3000`
2. **Connect MetaMask:** Make sure you're on Sapphire Testnet
3. **Login:** Connect your wallet with TEST tokens
4. **Test functionality:** Submit reports, verify users, etc.

### **T7: Get GCR Tokens for Testnet Testing**

**Mint GCR tokens via API:**
```powershell
# Replace YOUR_WALLET_ADDRESS with your actual address
Invoke-RestMethod -Uri "http://localhost:3001/api/stake/mint-tokens" -Method POST -ContentType "application/json" -Body '{"address": "YOUR_WALLET_ADDRESS", "amount": 100}'
```

### **📋 Testnet Information**
- **Testnet RPC:** `https://testnet.sapphire.oasis.dev`
- **Chain ID:** `23295` (0x5aff)
- **Currency:** `TEST` tokens
- **Block Explorer:** `https://testnet.explorer.sapphire.oasis.dev`
- **Faucet:** `https://faucet.testnet.oasis.dev/`

### **🔧 Testnet Troubleshooting**

#### **"Insufficient balance" Error**
```
Solution: Get more TEST tokens from faucet
Faucet: https://faucet.testnet.oasis.dev/
Wait: 1-2 minutes for tokens to arrive
```

#### **"Wrong network" Error**  
```
Solution: Switch MetaMask to Sapphire Testnet
Chain ID: 23295
RPC URL: https://testnet.sapphire.oasis.dev
```

#### **"Contract not found" Error**
```
Solution: Verify contract addresses in .env files
Check: Both API and Frontend .env files have correct addresses
Verify: Contracts deployed successfully with testnet-deploy
```

---

## 🔗 **Step 2: Start API Server (Localnet)**

The API server connects your React frontend to the blockchain smart contracts.

### **2.1 Navigate to API Folder**
```bash
# From project root
cd api
```

### **2.2 Install Dependencies**
```bash
npm install
```

### **2.3 Configure Environment**
```bash
# Copy environment file
cp .env.example .env
```

The `.env` file should have:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Blockchain Network
NETWORK=localnet

# Contract Addresses (update these with your deployed addresses from Step 1.3)
CONTRACT_ADDRESS_REWARD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
CONTRACT_ADDRESS_USER_VERIFICATION=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CONTRACT_ADDRESS_REPORT_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Blockchain Connection
RPC_URL=http://localhost:8545
```

### **2.4 Start API Server**
```bash
npm run dev
```

**✅ Expected Output:**
```
🚀 GuardianChain API Server starting...
✅ Connected to blockchain at http://localhost:8545
🔗 Loaded contract: RewardToken at 0x5FbDB...
🔗 Loaded contract: UserVerification at 0xe7f17...
🔗 Loaded contract: ReportContract at 0x9fE46...
🌐 Server running on http://localhost:3001
📋 API Documentation: http://localhost:3001/api/health
```

### **2.5 Test API Server**
Open `http://localhost:3001/api/health` in your browser. You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-08-08T...",
  "network": "localnet",
  "blockchain": "connected"
}
```

---

## 🎨 **Step 3: Start Frontend React App**

The frontend provides the user interface for interacting with GuardianChain.

### **3.1 Navigate to Frontend Folder**
```bash
# From project root (open a NEW terminal)
cd frontend
```

### **3.2 Install Dependencies**
```bash
npm install
```

### **3.3 Configure Environment**
```bash
# Copy environment file
cp .env.example .env
```

### **3.4 Update Contract Addresses**
Edit `frontend/.env` with your deployed contract addresses:

```env
# Environment Configuration
VITE_API_URL=http://localhost:3001/api
VITE_NETWORK=localnet

# Contract Addresses (Update with your addresses from Step 1.3)
VITE_CONTRACT_ADDRESS_REWARD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CONTRACT_ADDRESS_USER_VERIFICATION=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Optional: Custom RPC URLs
# VITE_LOCALNET_RPC=http://localhost:8545
```

### **3.5 Start Frontend Development Server**
```bash
npm run dev
```

**✅ Expected Output:**
```
  VITE v5.x.x ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### **3.6 Open Application**
Visit `http://localhost:3000` in your browser. You should see the GuardianChain homepage!

---

## 🦊 **Step 4: Configure MetaMask**

Set up MetaMask to connect to your local blockchain.

### **4.1 Add Sapphire Localnet to MetaMask**

1. **Open MetaMask** → **Networks** → **Add Network** → **Add Network Manually**

2. **Enter Network Details:**
   ```
   Network name: Sapphire Localnet
   New RPC URL: http://localhost:8545
   Chain ID: 23293
   Currency symbol: TEST
   Block explorer URL: (leave empty)
   ```

3. **Click "Save"**

### **4.2 Import Pre-funded Account**

1. **MetaMask** → **Account Menu** → **Import Account**
2. **Select "Private Key"**
3. **Enter this private key:**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. **Click "Import"**

**✅ You should now see 10,000 TEST tokens in your MetaMask!**

### **4.3 Test Wallet Connection**

1. **Go to** `http://localhost:3000/login`
2. **Click "Connect Wallet"**
3. **Approve connection in MetaMask**
4. **Sign the authentication message**

---

## 🎯 **Step 5: Verify Complete Setup**

### **5.1 Check All Services Are Running**

You should have **4 terminals running:**

1. **Terminal 1 (Docker):** Sapphire blockchain
   ```
   JSON-RPC server listening on 0.0.0.0:8545
   ```

2. **Terminal 2 (Backend):** Contract deployment completed
   ```
   ✅ Deployment complete!
   ```

3. **Terminal 3 (API):** API server
   ```
   🌐 Server running on http://localhost:3001
   ```

4. **Terminal 4 (Frontend):** React dev server
   ```
   ➜  Local: http://localhost:3000/
   ```

### **5.2 Test Complete Flow**

1. **Visit:** `http://localhost:3000`
2. **Login:** Connect MetaMask wallet
3. **Navigate:** Try different pages (Dashboard, Reports, etc.)
4. **Submit:** Create a test report
5. **Verify:** Check that everything works end-to-end

---

## 🪙 **Step 6: Get GCR Tokens for Testing**

To use the stake-based verification system, your wallet needs **GCR tokens**. Here's how to get them:

### **6.1 Mint GCR Tokens via API**

Use the built-in mint endpoint to get 100 GCR tokens:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stake/mint-tokens" -Method POST -ContentType "application/json" -Body '{"address": "YOUR_WALLET_ADDRESS", "amount": 100}'
```

**Bash/Linux:**
```bash
curl -X POST http://localhost:3001/api/stake/mint-tokens \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS", "amount": 100}'
```

**Replace `YOUR_WALLET_ADDRESS`** with your MetaMask address (starts with 0x...)

### **6.2 Verify Token Balance**

After minting, you should see:
```json
{
  "success": true,
  "message": "Successfully minted 100 GCR tokens",
  "data": {
    "transactionHash": "0x...",
    "amountMinted": 100,
    "newBalance": "100.0",
    "address": "0x..."
  }
}
```

### **6.3 Test Stake-Based Verification**

Now you can test the verification flow:

1. **Go to Submit Report page:** `http://localhost:3000/submit-report`
2. **Click "Stake & Get Verified"**
3. **Fill the form:** Enter identifier and longevity
4. **Approve MetaMask transaction:** Send 10 GCR to treasury
5. **Get verified automatically:** Account becomes verified instantly

**✅ Expected result:** Your account is verified and you can submit reports!

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **🚨 "Connection Refused" Errors**
```
Solution: Ensure Docker blockchain is running on port 8545
Command: docker ps (should show sapphire-localnet container)
```

#### **🚨 "Contract Not Found" Errors**
```
Solution: Redeploy contracts and update .env files
Commands: 
cd backend && npm run localnet-deploy
Update contract addresses in frontend/.env and api/.env
```

#### **🚨 "MetaMask Wrong Network"**
```
Solution: Switch to Sapphire Localnet in MetaMask
Network: Sapphire Localnet (Chain ID: 23293)
RPC URL: http://localhost:8545
```

#### **🚨 "No TEST Tokens"**
```
Solution: Import pre-funded account
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Each account has 10,000 TEST tokens
```

#### **🚨 "API 404 Errors"**
```
Solution: Ensure API server is running
Command: cd api && npm run dev
Check: http://localhost:3001/api/health
```

#### **🚨 "Frontend Won't Load"**
```
Solution: Check all environment variables are set correctly
Files: frontend/.env, api/.env, backend/.env
```

### **🔍 Debug Commands**

```bash
# Check if Docker is running
docker ps

# Test blockchain connection
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# Test API health
curl http://localhost:3001/api/health

# Check frontend build
cd frontend && npm run build

# View logs
cd api && npm run dev (shows API logs)
cd backend && npm run localnet-demo (tests contracts)
```

---

## 🚀 **Quick Deployment Scripts**

### **Testnet Quick Deploy (Windows PowerShell):**
```powershell
# Save this as deploy-testnet.ps1
Write-Host "🚀 GuardianChain Testnet Deployment" -ForegroundColor Green

# Step 1: Deploy Backend
Write-Host "`n1. Deploying Backend Contracts..." -ForegroundColor Yellow
cd backend
npm run testnet-deploy

# Wait for user to update .env files
Write-Host "`n📝 Please update the .env files in api/ and frontend/ with the contract addresses shown above." -ForegroundColor Cyan
Read-Host "Press Enter when you've updated the .env files..."

# Step 2: Start API
Write-Host "`n2. Starting API Server..." -ForegroundColor Yellow
cd ../api
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev"

# Step 3: Start Frontend  
Write-Host "`n3. Starting Frontend..." -ForegroundColor Yellow
cd ../frontend
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`n✅ Testnet deployment complete!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 API: http://localhost:3001" -ForegroundColor Cyan
```

### **Localnet Quick Start (Windows PowerShell):**
```powershell
# Save this as start-localnet.ps1  
Write-Host "🚀 GuardianChain Localnet Startup" -ForegroundColor Green

# Step 1: Start Docker
Write-Host "`n1. Starting Docker Blockchain..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "docker run -it -p8545:8545 -p8546:8546 ghcr.io/oasisprotocol/sapphire-localnet:latest-2025-08-05-gita4d5d8b"

# Wait for Docker to start
Start-Sleep -Seconds 10

# Step 2: Deploy Contracts
Write-Host "`n2. Deploying Contracts..." -ForegroundColor Yellow
cd backend
npm run localnet-deploy

# Step 3: Start API
Write-Host "`n3. Starting API Server..." -ForegroundColor Yellow
cd ../api
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev"

# Step 4: Start Frontend
Write-Host "`n4. Starting Frontend..." -ForegroundColor Yellow
cd ../frontend  
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`n✅ Localnet startup complete!" -ForegroundColor Green
```

### **Windows (start.bat):**
@echo off
echo Starting GuardianChain Complete Stack...

echo 1. Starting Docker Blockchain...
start "Docker Blockchain" docker run -it -p 8545:8545 -p 8546:8546 ghcr.io/oasisprotocol/sapphire-localnet -test-mnemonic

timeout /t 10

echo 2. Deploying Contracts...
cd backend
start "Deploy Contracts" cmd /k "npm run localnet-deploy"

timeout /t 15

echo 3. Starting API Server...
cd ../api
start "API Server" cmd /k "npm run dev"

timeout /t 5

echo 4. Starting Frontend...
cd ../frontend
start "Frontend" cmd /k "npm run dev"

echo All services starting! Check the opened windows.
pause
```

### **Unix/Mac (start.sh):**
```bash
#!/bin/bash
echo "🚀 Starting GuardianChain Complete Stack..."

echo "1. Starting Docker Blockchain..."
gnome-terminal -- docker run -it -p 8545:8545 -p 8546:8546 ghcr.io/oasisprotocol/sapphire-localnet -test-mnemonic

sleep 10

echo "2. Deploying Contracts..."
cd backend
gnome-terminal -- bash -c "npm run localnet-deploy; exec bash"

sleep 15

echo "3. Starting API Server..."
cd ../api  
gnome-terminal -- bash -c "npm run dev; exec bash"

sleep 5

echo "4. Starting Frontend..."
cd ../frontend
gnome-terminal -- bash -c "npm run dev; exec bash"

echo "✅ All services started! Check the opened terminals."
```

---

## 📚 **Additional Resources**

### **Environment Configuration Summary**

| Component | Localnet | Testnet |
|-----------|----------|---------|
| **Backend** | `PRIVATE_KEY=0xac09...` (Docker default) | `PRIVATE_KEY=0xYOUR_REAL_KEY` |
| **API** | `NETWORK=localnet` | `NETWORK=testnet` |
| **Frontend** | `VITE_NETWORK=localnet` | `VITE_NETWORK=testnet` |
| **Contracts** | Auto-deployed to localhost:8545 | Deployed to testnet.sapphire.oasis.dev |
| **Tokens** | Pre-funded 10,000 TEST | Get from faucet |

### **Documentation**
- **Backend README:** `backend/README.md`
- **API README:** `api/README.md`  
- **Frontend README:** `frontend/README.md`
- **Project Summary:** `backend/PROJECT_SUMMARY.md`

### **Demo Scripts**
```bash
# Backend demos
cd backend
npm run full-demo        # Complete workflow demo
npm run content-test     # Test encrypted content
npm run localnet-demo    # Basic functionality test

# API tests
cd api
npm test                 # Run API tests

# Frontend tests  
cd frontend
npm test                 # Run frontend tests
```

### **Network Information**

| Network | RPC URL | Chain ID | Currency | Block Explorer | Faucet |
|---------|---------|----------|----------|----------------|---------|
| **Localnet** | `http://localhost:8545` | `23293` (0x5afd) | TEST | Not available | Docker pre-funded |
| **Testnet** | `https://testnet.sapphire.oasis.dev` | `23295` (0x5aff) | TEST | [testnet.explorer.sapphire.oasis.dev](https://testnet.explorer.sapphire.oasis.dev) | [faucet.testnet.oasis.dev](https://faucet.testnet.oasis.dev/) |
| **Mainnet** | `https://sapphire.oasis.io` | `23294` (0x5afe) | ROSE | [explorer.sapphire.oasis.dev](https://explorer.sapphire.oasis.dev) | Buy ROSE tokens |

---

## 🎉 **Success!**

If you've followed all steps, you should now have:

✅ **Blockchain running** with deployed smart contracts  
✅ **API server running** on port 3001  
✅ **Frontend running** on port 3000  
✅ **MetaMask configured** with test tokens  
✅ **Complete GuardianChain** ready for development!

### **Next Steps:**
- **Explore the application** - Submit reports, verify users, claim rewards
- **Develop new features** - The complete stack is ready for customization
- **Deploy to testnet** - Use the **TESTNET DEPLOYMENT** section above for live testing
- **Deploy to mainnet** - When ready, deploy to Sapphire mainnet (update RPC URLs and chain IDs)

---

**Built with ❤️ for the GuardianChain community**

*For support, issues, or questions, please check the individual README files in each directory or create an issue in the repository.*
