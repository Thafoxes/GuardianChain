# GuardianChain API

REST API server for GuardianChain that connects React frontend to Oasis Sapphire smart contracts.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- Deployed GuardianChain contracts (from `/backend`)

### Installation

1. **Install dependencies**
```bash
cd api
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your contract addresses
```

3. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - API health status
- `GET /api/health/contracts` - Contract connectivity status

### Authentication
- `POST /api/auth/connect-wallet` - Connect wallet
- `POST /api/auth/verify-signature` - Verify wallet signature
- `GET /api/auth/session/:address` - Get session info

### User Management
- `POST /api/users/register` - Register new user
- `GET /api/users/:address/status` - Check user status
- `POST /api/users/:address/identifier` - Get encrypted identifier
- `GET /api/users/:address/balance` - Get user balances
- `GET /api/users/stats/total` - Get total users

### Report Management
- `POST /api/reports/submit` - Submit new report
- `GET /api/reports/user/:address` - Get user's reports
- `GET /api/reports/:id` - Get report info
- `POST /api/reports/:id/content` - Get decrypted content
- `POST /api/reports/:id/claim-reward` - Claim reward
- `GET /api/reports/stats/total` - Get total reports

### Admin Operations
- `POST /api/admin/verify-user` - Verify user (admin)
- `POST /api/admin/add-verifier` - Add verifier (admin)
- `POST /api/admin/update-report-status` - Update report status
- `POST /api/admin/reports/status/:status` - Get reports by status
- `GET /api/admin/stats` - Get admin statistics

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Network
NETWORK=localnet

# Contract Addresses (update after deployment)
REWARD_TOKEN_ADDRESS=0x...
USER_VERIFICATION_ADDRESS=0x...
REPORT_CONTRACT_ADDRESS=0x...
```

### Network Options
- `localnet` - Docker Sapphire localnet
- `testnet` - Sapphire testnet
- `mainnet` - Sapphire mainnet

## 📋 Usage Examples

### Register User
```javascript
const response = await fetch('/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'John Doe, Cybersecurity Expert',
    longevity: 10,
    walletAddress: '0x...',
    privateKey: '0x...'
  })
});
```

### Submit Report
```javascript
const response = await fetch('/api/reports/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'CRITICAL: Smart contract vulnerability detected...',
    walletAddress: '0x...',
    privateKey: '0x...'
  })
});
```

### Get Report Content
```javascript
const response = await fetch('/api/reports/1/content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0x...',
    privateKey: '0x...'
  })
});
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for React frontend
- **Input Validation**: All endpoints validate input data
- **Error Handling**: Comprehensive error responses
- **Logging**: Winston-based logging system

## 🏗️ Architecture

```
api/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic & blockchain interaction
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Express app setup
├── contracts/           # Contract ABI files
├── logs/               # Application logs
└── package.json
```

## 🔗 Frontend Integration

This API is designed to work with React frontends using libraries like:
- **ethers.js** - For wallet connections
- **axios/fetch** - For API calls
- **React Query** - For data fetching and caching

Example React hook:
```javascript
const useSubmitReport = () => {
  return useMutation(async ({ content, walletAddress, privateKey }) => {
    const response = await fetch('/api/reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, walletAddress, privateKey })
    });
    return response.json();
  });
};
```

## 📊 Development Commands

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test          # Run tests
npm run lint      # Lint code
npm run build     # Compile contracts from backend
```

## 🔄 Contract Integration

The API automatically loads contract ABIs and addresses from environment variables. When contracts are deployed, update the `.env` file with the new addresses.

## 📝 Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## 🚨 Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

## 🌐 CORS Configuration

CORS is configured to allow requests from your React frontend. Update `FRONTEND_URL` in `.env` to match your frontend URL.

---

**Ready to integrate with your React frontend! 🎯**
