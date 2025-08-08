# GuardianChain Frontend

React TypeScript frontend for GuardianChain - A decentralized reporting platform built on Oasis Sapphire blockchain.

## � System Requirements

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **NPM 8+** or **Yarn 1.22+**
- **Git** for version control
- **MetaMask** browser extension (required)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Internet connection** for blockchain interactions

### Required Software Installation

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` (should be 18+)
   - Verify npm: `npm --version`

2. **Install MetaMask Browser Extension**
   - Download from [metamask.io](https://metamask.io/)
   - Create wallet or import existing one
   - **Required for all blockchain interactions**

3. **Install Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Required for cloning the repository

## 🚀 Quick Start

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Thafoxes/GuardianChain.git
   cd GuardianChain/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_NETWORK=localnet
   VITE_CONTRACT_ADDRESS_REWARD_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
   VITE_CONTRACT_ADDRESS_USER_VERIFICATION=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

### Dependencies Installed
- **react**: Core React library (v18)
- **react-dom**: React DOM rendering
- **typescript**: TypeScript language support
- **vite**: Fast build tool and dev server
- **tailwindcss**: Utility-first CSS framework
- **react-router-dom**: Client-side routing
- **axios**: HTTP client for API calls
- **ethers**: Ethereum library for blockchain interactions
- **@oasisprotocol/sapphire-paratime**: Oasis Sapphire integration
- **lucide-react**: Modern icon library
- **react-hot-toast**: Toast notifications
- **@types/react**: TypeScript definitions for React

## ⚙️ Setup Requirements Checklist

Before running the frontend, ensure you have:

- [ ] **Node.js 18+** installed and verified
- [ ] **MetaMask** browser extension installed
- [ ] **API server** running on `http://localhost:3001`
- [ ] **Blockchain localnet** running (Docker)
- [ ] **Environment file** configured with correct contract addresses
- [ ] **Dependencies** installed via `npm install`

## 🔧 MetaMask Configuration

### Add Sapphire Localnet to MetaMask

1. **Open MetaMask** browser extension
2. **Click network dropdown** (top of MetaMask)
3. **Select "Add Network"** or "Add a network manually"
4. **Enter network details**:
   ```
   Network Name: Sapphire Localnet
   RPC URL: http://localhost:8545
   Chain ID: 23293
   Currency Symbol: ROSE
   Block Explorer URL: (leave empty)
   ```
5. **Save** and **switch** to the new network

### Import Test Accounts

For testing, import these pre-funded accounts:

1. **Reporter Account**:
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

2. **Admin/Verifier Account**:
   ```
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   ```

## 🚨 Troubleshooting

### Common Issues

1. **"MetaMask not detected"**
   - Install MetaMask browser extension
   - Refresh the page after installation
   - Ensure MetaMask is unlocked

2. **"Wrong network" error**
   - Add Sapphire Localnet to MetaMask (see above)
   - Switch to Sapphire Localnet in MetaMask

3. **"API connection failed"**
   - Ensure API server is running on port 3001
   - Check `.env` file has correct `VITE_API_URL`
   - Verify CORS settings in API

4. **"Contract not found" errors**
   - Deploy contracts first using `/backend`
   - Update contract addresses in `.env`
   - Restart frontend server after env changes

5. **"Transaction failed" errors**
   - Ensure you're on the correct network
   - Check you have sufficient test tokens
   - Verify you're using the correct account

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint TypeScript/React code
npm run type-check   # Check TypeScript types
```

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Web3**: ethers.js + Oasis Sapphire
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components (Navbar, Footer)
│   │   └── ui/           # Basic UI components
│   ├── contexts/         # React Context providers
│   │   ├── WalletContext.tsx    # Wallet connection & management
│   │   └── AuthContext.tsx      # User authentication
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SubmitReportPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/         # API and external services
│   │   └── api.ts        # Backend API client
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔗 Core Features

### 🔐 Wallet Integration
- **MetaMask Connection**: Seamless wallet connection
- **Sapphire Network**: Auto-switch to Oasis Sapphire
- **Network Detection**: Validates correct network
- **Account Management**: Handle account changes

### 🛡️ Authentication System
- **Signature-based Auth**: No passwords, wallet signatures only
- **Role-based Access**: USER, ADMIN, VERIFIER roles
- **Session Management**: Persistent login state
- **Protected Routes**: Route-level access control

### 📝 Report Management
- **Submit Reports**: Encrypted report submission
- **View Reports**: Browse and filter reports
- **Report Details**: Detailed view with decryption
- **Status Tracking**: Monitor report verification status

### 🎯 User Dashboard
- **Personal Stats**: Reports, rewards, verification status
- **Wallet Info**: Balance, token holdings
- **Recent Activity**: Latest reports and transactions
- **Quick Actions**: Submit report, claim rewards

### 👨‍💼 Admin Panel
- **User Management**: View, verify, manage users
- **Report Oversight**: Monitor all reports
- **System Stats**: Platform analytics
- **Verifier Management**: Add/remove verifiers

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint | `http://localhost:3001/api` |
| `VITE_NETWORK` | Target network (localnet/testnet/mainnet) | `localnet` |
| `VITE_CONTRACT_ADDRESS_*` | Smart contract addresses | - |

### Network Configuration

The app supports multiple Oasis Sapphire networks:

- **Localnet**: Development (TEST tokens)
- **Testnet**: Testing (TEST tokens) 
- **Mainnet**: Production (ROSE tokens)

## 🎨 UI/UX Features

### 🎭 Theme System
- **Custom Color Palette**: Primary, secondary, accent colors
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Theme structure prepared
- **Animations**: Smooth transitions and loading states

### 📱 Mobile Experience
- **Responsive Layout**: Works on all screen sizes
- **Touch Optimized**: Mobile-friendly interactions
- **Progressive Enhancement**: Core features work everywhere

### ♿ Accessibility
- **Semantic HTML**: Proper heading structure
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Tab-accessible interfaces
- **Color Contrast**: WCAG compliant colors

## 🔌 API Integration

### Authentication Endpoints
```typescript
// Get login nonce
authApi.getNonce(address: string)

// Login with signature
authApi.login({ address, signature, message, nonce })

// Register new user
authApi.register({ address, signature, message, nonce, metadata })

// Get user profile
authApi.getProfile()
```

### Report Endpoints
```typescript
// Submit new report
reportApi.submitReport({ content, category, anonymous })

// Get reports list
reportApi.getReports({ status, limit, offset })

// Get report details
reportApi.getReport(id: string)

// Get encrypted content
reportApi.getReportContent(id: string)
```

### User Endpoints
```typescript
// Get user statistics
userApi.getStats()

// Get user's reports
userApi.getUserReports()

// Claim report reward
userApi.claimReward(reportId: number)
```

## 🚦 State Management

### Context Providers

#### WalletContext
```typescript
interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToSapphire: () => Promise<void>;
  isCorrectNetwork: () => boolean;
}
```

#### AuthContext
```typescript
interface AuthContextType {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
  register: (metadata?: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

## 🛡️ Security Features

### 🔒 Data Protection
- **Client-side Encryption**: Sensitive data encryption
- **No Private Key Storage**: Keys stay in MetaMask
- **HTTPS Only**: Secure communication
- **XSS Protection**: Input sanitization

### 🔐 Authentication Security
- **Signature Verification**: Cryptographic authentication
- **Nonce-based**: Replay attack prevention
- **Session Timeout**: Auto-logout after inactivity
- **Role Verification**: Server-side permission checks

## 📋 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript compiler
npm run type-check

# Run ESLint
npm run lint
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Preview build locally
npm run preview
```

The build output will be in the `dist/` directory.

## 🔄 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Custom Server
```bash
# Build project
npm run build

# Serve dist folder with any static server
# Example with serve:
npx serve -s dist -l 3000
```

## 🔗 Integration with Backend

The frontend expects the backend API to be running at the configured URL. Make sure:

1. Backend server is running (`npm run dev` in `/api` folder)
2. Smart contracts are deployed
3. Environment variables match deployed contract addresses
4. CORS is configured to allow frontend domain

## 🐛 Troubleshooting

### Common Issues

#### MetaMask Connection
```
Error: "MetaMask not detected"
Solution: Install MetaMask browser extension
```

#### Network Issues
```
Error: "Wrong network"
Solution: Switch to Sapphire network in MetaMask
```

#### API Connection
```
Error: "Network Error"
Solution: Check if backend is running and VITE_API_URL is correct
```

#### Build Errors
```
Error: TypeScript compilation errors
Solution: Run npm run type-check to see detailed errors
```

### Debug Mode

Enable debug logging:
```typescript
// In main.tsx
if (import.meta.env.DEV) {
  console.log('Debug mode enabled');
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Oasis Protocol](https://oasisprotocol.org/) for Sapphire privacy blockchain
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [ethers.js](https://ethers.org/) for Web3 integration

---

**Built with ❤️ for the GuardianChain community**
