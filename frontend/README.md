# GuardianChain Frontend

React TypeScript frontend for GuardianChain - A decentralized reporting platform built on Oasis Sapphire blockchain.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask browser extension

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_NETWORK=localnet
   VITE_CONTRACT_ADDRESS_REWARD_TOKEN=your_token_address
   VITE_CONTRACT_ADDRESS_USER_VERIFICATION=your_verification_address
   VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=your_report_address
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

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
