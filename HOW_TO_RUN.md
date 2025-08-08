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
docker run -it -p 8545:8545 -p 8546:8546 ghcr.io/oasisprotocol/sapphire-localnet -test-mnemonic
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

## 🔗 **Step 2: Start API Server**

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

## 🚀 **Quick Start Script**

Create this script to automate the startup process:

### **Windows (start.bat):**
```batch
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
- **Localnet RPC:** `http://localhost:8545`
- **Localnet WebSocket:** `ws://localhost:8546`
- **Chain ID:** `23293` (0x5afd)
- **Currency:** `TEST` tokens
- **Block Explorer:** Not available for localnet

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
- **Deploy to testnets** - When ready, deploy to Sapphire testnet/mainnet

---

**Built with ❤️ for the GuardianChain community**

*For support, issues, or questions, please check the individual README files in each directory or create an issue in the repository.*
