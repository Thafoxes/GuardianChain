# GuardianChain 🛡️

A privacy-preserving whistleblower protection platform built on Oasis Sapphire blockchain, specifically designed for Malaysian compliance with the Whistleblower Protection Act 2010 (Act 711).

## 🎯 Project Overview

GuardianChain revolutionizes whistleblowing by providing a secure, anonymous, and legally compliant platform that protects whistleblowers while enabling effective investigation of misconduct. Built with privacy-first blockchain technology, it addresses the critical need for safe reporting mechanisms in Malaysia and beyond.

## 🌟 Key Features

### 🔒 Privacy & Security
- **Zero-Knowledge Reports**: Anonymous submission with cryptographic privacy
- **Secure Identity Management**: Optional identity verification without exposure
- **Encrypted Communication**: End-to-end encrypted messaging between parties
- **Blockchain Immutability**: Tamper-proof evidence storage

### 🏛️ Legal Compliance
- **Act 711 Aligned**: Full compliance with Malaysian Whistleblower Protection Act 2010
- **MACC Integration Ready**: Designed for Malaysian Anti-Corruption Commission workflows
- **Audit Trail**: Complete investigation history for legal proceedings
- **Evidence Chain**: Cryptographic proof of evidence integrity

### 💰 Economic Incentives
- **GCR Token Rewards**: Incentivize quality reporting and verification
- **Staking Mechanism**: Economic commitment for verifiers and investigators
- **Token Faucet**: Easy access to test tokens for new users
- **Reputation System**: Build trust through verified contributions

### 🎮 User Experience
- **Intuitive Dashboard**: Clean, accessible interface for all user types
- **Role-Based Access**: Tailored experiences for reporters, verifiers, and investigators
- **Real-time Updates**: Live status tracking for all reports
- **Mobile Responsive**: Access from any device, anywhere

## 🚀 Demo

**Live Demo**: [Watch on YouTube](https://youtu.be/l2_NXuZG2Kg)

Experience the platform live at: [Your deployment URL]

## 🏗️ Technical Architecture

### Blockchain Layer
- **Oasis Sapphire Testnet**: Privacy-preserving smart contracts
- **Smart Contracts**: ReportContract, UserVerification, RewardToken
- **Confidential Computing**: Sensitive data processing in TEEs

### Backend Services
- **Node.js API**: RESTful services for blockchain interaction
- **Authentication**: JWT-based secure user sessions
- **File Storage**: Encrypted evidence handling
- **Notification System**: Real-time updates via WebSockets

### Frontend Application
- **React + TypeScript**: Modern, type-safe user interface
- **Tailwind CSS**: Responsive, accessible design
- **MetaMask Integration**: Seamless wallet connectivity
- **Progressive Web App**: Offline-capable mobile experience

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MetaMask wallet
- Git

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/Thafoxes/GuardianChain.git
cd GuardianChain
```

2. **Environment Setup**
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
```

3. **Docker Deployment**
```bash
# Start all services
docker-compose up -d

# Check services
docker-compose ps
```

4. **Local Development**
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all
```

### Network Configuration

**Oasis Sapphire Testnet**
- Network Name: Sapphire Testnet
- RPC URL: `https://testnet.sapphire.oasis.dev`
- Chain ID: 23295 (0x5aff)
- Currency: TEST

Add to MetaMask using our built-in network switcher.

## 📊 Contract Addresses

### Sapphire Testnet
- **ReportContract**: `0x...` (Updated after deployment)
- **UserVerification**: `0x...`
- **RewardToken (GCR)**: `0x...`

### Localnet (Development)
- All contracts available in `backend/deployments/`

## 🧪 Testing

```bash
# Run smart contract tests
cd backend
npm test

# Run API tests
cd api
npm test

# Run frontend tests
cd frontend
npm test

# Integration tests
npm run test:e2e
```

## 📖 Usage Guide

### For Whistleblowers (Reporters)
1. **Connect Wallet**: Link your MetaMask to the platform
2. **Submit Report**: Create anonymous or verified reports
3. **Upload Evidence**: Securely attach supporting documents
4. **Track Progress**: Monitor investigation status
5. **Receive Rewards**: Earn GCR tokens for verified reports

### For Verifiers
1. **Stake Tokens**: Commit GCR tokens to participate
2. **Review Reports**: Assess submitted reports for validity
3. **Vote on Legitimacy**: Contribute to consensus mechanism
4. **Earn Rewards**: Receive tokens for accurate verification

### For Investigators
1. **Access Assigned Cases**: View reports requiring investigation
2. **Secure Communication**: Contact reporters through encrypted channels
3. **Document Findings**: Record investigation results on-chain
4. **Close Cases**: Complete investigations with final outcomes

### For Administrators
1. **Monitor Platform**: Oversee all platform activities
2. **Manage Users**: Handle user verification and permissions
3. **System Configuration**: Adjust platform parameters
4. **Generate Reports**: Export data for compliance and analysis

## 🌍 Malaysian Context

### Whistleblower Protection Act 2010 Compliance
- **Section 6**: Anonymous reporting mechanisms ✅
- **Section 7**: Protection from retaliation ✅
- **Section 10**: Proper investigation procedures ✅
- **Section 15**: Evidence preservation requirements ✅

### MACC Integration Benefits
- Streamlined report submission to Malaysian Anti-Corruption Commission
- Automated case classification and routing
- Compliance with Malaysian legal frameworks
- Enhanced transparency in corruption investigations


### Innovation Highlights
- First blockchain-based whistleblower platform in Malaysia
- Integration of privacy-preserving technology with legal compliance
- Economic incentive model to encourage quality reporting
- Mobile-first design for widespread accessibility

### Scalability Potential
- Adaptable to other ASEAN countries with similar legal frameworks
- Enterprise deployment for corporate compliance programs
- Government adoption for public sector transparency
- NGO partnerships for advocacy and awareness

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Documentation

- **Technical Docs**: `/docs/technical/`
- **API Reference**: `/docs/api/`
- **User Guides**: `/docs/user/`
- **Deployment Guide**: `HOW_TO_RUN.md`
- **Hackathon Pitch**: `HACKATHON_PITCH_DECK.md`

## 🔧 Configuration

### Environment Variables
```bash
# Blockchain Configuration
TESTNET_PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=deployed_contract_address

# API Configuration
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url

# Frontend Configuration
VITE_API_URL=http://localhost:3000
VITE_BLOCKCHAIN_NETWORK=sapphire-testnet
```


## Future implementation
- 🤖 AI-powered report analysis
- 🌐 IPFS decentralized storage
- 🔍 Automated severity assessment
- 📊 Predictive corruption analytics

## 🚀 Future Implementations

### 🌐 IPFS Integration (Decentralized File Storage)

**Current Challenge**: Centralized file storage creates single points of failure and privacy concerns.


**Benefits**:
- **Decentralized Storage**: No single point of failure
- **Content Addressing**: Immutable file identification
- **Global Availability**: Accessible worldwide through IPFS gateways
- **Cost Efficiency**: Reduced storage costs compared to traditional cloud
- **Privacy Enhanced**: Files encrypted before IPFS upload

**Technical Implementation**:
- **IPFS Nodes**: Pinning services for reliable availability
- **Encryption Layer**: Client-side encryption before upload
- **Smart Contract Integration**: Store IPFS hashes on-chain
- **Access Control**: Encrypted keys for authorized access only

### 🤖 AI-Powered Report Analysis

**Current Challenge**: Manual report review is time-consuming and may miss critical patterns.

**AI Capabilities**:

1. **Authenticity Detection**:
   - Language pattern analysis for fake reports
   - Cross-reference with known fraudulent patterns
   - Behavioral analysis of submission patterns
   - Evidence consistency checking

2. **Severity Assessment**:
   - Financial impact estimation
   - Social harm evaluation
   - Legal severity classification
   - Urgency prioritization

3. **Smart Categorization**:
   - Corruption type classification (bribery, embezzlement, etc.)
   - Jurisdiction identification
   - Department/agency tagging
   - Stakeholder impact analysis

4. **Predictive Analytics**:
   - Corruption trend identification
   - Risk hotspot mapping
   - Resource allocation optimization
   - Investigation outcome prediction

### 🔍 Advanced Analysis Features

**Real-time Monitoring**:
- **Anomaly Detection**: Identify unusual reporting patterns
- **Network Analysis**: Detect corruption networks and relationships
- **Trend Forecasting**: Predict corruption hotspots
- **Resource Optimization**: Smart allocation of investigation resources

## 🌟 Additional Future Innovations

#### **Zero-Knowledge Machine Learning**
```solidity
// Future ZK-ML integration
contract ZKMLAnalyzer {
    using ZKProofs for bytes32;
    
    function analyzeWithPrivacy(
        bytes32 reportHash,
        bytes calldata zkProof
    ) external returns (uint8 severityScore, bool isAuthentic) {
        // Analyze report without revealing content
        require(zkProof.verifyMLComputation(reportHash), "Invalid ZK proof");
        return processAnalysis(reportHash);
    }
}
```

**Benefits**:
- Analyze reports without exposing sensitive content
- Privacy-preserving pattern detection
- Confidential severity scoring
- Anonymous trend analysis

#### **Cross-Chain Governance**
- **Multi-Blockchain Support**: Ethereum, Polygon, BSC integration
- **DAO Governance**: Decentralized platform governance
- **Cross-Chain Evidence**: Evidence verification across networks
- **Universal Reputation**: Portable reputation across platforms

#### **Regulatory Technology (RegTech) Integration**
- **Automated Compliance**: Real-time regulatory compliance checking
- **Regulatory Reporting**: Automatic report generation for authorities
- **Policy Impact Analysis**: Assess policy effectiveness
- **Compliance Dashboard**: Real-time compliance monitoring

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Oasis Protocol Foundation for Sapphire blockchain
- Open source community for tools and libraries
- DevMatch organizers for the opportunity

---
